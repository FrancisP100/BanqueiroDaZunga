/**
 * lib/integrations/registry.ts
 *
 * Registo central de integrações. Ponto único de importação para todo o
 * código da aplicação. Cada integração regista-se aqui e o registry
 * determina se está activa com base na configuração global.
 *
 * Uso típico:
 *   import { registry } from "@/lib/integrations/registry";
 *
 *   const validator = registry.getBiValidator();
 *   if (validator?.isAvailable()) {
 *     const result = await validator.execute({ biNumber });
 *     ...
 *   }
 */

import type {
  IntegrationAdapter,
  IntegrationMeta,
  IntegrationsConfig,
  StorageAdapter,
} from "./types";
import type { BiValidationAdapter } from "./bi-validation/types";
import { DEFAULT_INTEGRATIONS_CONFIG } from "./types";

/**
 * Mapeamento entre adapterId e a chave da config a que pertence.
 * Ex.: "minfin-bi-validation" → "biValidation"
 */
type AdapterFeatureMap = Map<string, keyof IntegrationsConfig>;

class IntegrationsRegistry {
  private config: IntegrationsConfig = DEFAULT_INTEGRATIONS_CONFIG;

  /** Adapters registados, indexados por id */
  private adapters = new Map<string, IntegrationAdapter<unknown, unknown>>();

  /** Mapeamento adapterId → featureKey */
  private featureMap: AdapterFeatureMap = new Map();

  // ─── Configuração ────────────────────────────────────────────

  /** Carrega a configuração (chamar no arranque) */
  loadConfig(config: Partial<IntegrationsConfig>): void {
    this.config = { ...DEFAULT_INTEGRATIONS_CONFIG, ...config };
  }

  /** Devolve a configuração actual (para UI de administração) */
  getConfig(): Readonly<IntegrationsConfig> {
    return this.config;
  }

  /** Altera dinamicamente uma feature flag */
  setFeature(
    key: keyof IntegrationsConfig,
    flag: Partial<IntegrationsConfig[keyof IntegrationsConfig]>,
  ): void {
    this.config[key] = { ...this.config[key], ...flag };
  }

  // ─── Registo ─────────────────────────────────────────────────

  /**
   * Regista um adapter associando-o a uma feature da config.
   * Ex.: registry.register(minfinAdapter, "biValidation");
   */
  register<TIn, TOut>(
    adapter: IntegrationAdapter<TIn, TOut>,
    featureKey: keyof IntegrationsConfig,
  ): void {
    if (this.adapters.has(adapter.id)) {
      console.warn(
        `[IntegrationsRegistry] Já existe um adapter registado com id "${adapter.id}". A substituir.`,
      );
    }
    this.adapters.set(adapter.id, adapter as IntegrationAdapter<unknown, unknown>);
    this.featureMap.set(adapter.id, featureKey);
  }

  /** Remove um adapter pelo id */
  unregister(id: string): void {
    this.adapters.delete(id);
    this.featureMap.delete(id);
  }

  /** Lista todos os adapters registados (para UI de admin) */
  listAdapters(): IntegrationMeta[] {
    return Array.from(this.adapters.values()).map((a) => a.getMeta());
  }

  /**
   * Procura um adapter pelo id, respeitando a config.
   * Se o adapter não existir ou estiver desligado, devolve null.
   * Quem chama deve fazer fallback para o comportamento manual.
   */
  getById<TIn, TOut>(
    id: string,
  ): IntegrationAdapter<TIn, TOut> | null {
    const adapter = this.adapters.get(id);
    if (!adapter) return null;

    const featureKey = this.featureMap.get(id);
    if (featureKey) {
      const featureConfig = this.config[featureKey];
      if (!featureConfig.enabled) return null;
    }

    return adapter as IntegrationAdapter<TIn, TOut>;
  }

  /**
   * Devolve o primeiro adapter disponível para uma feature,
   * ou null se nenhum estiver disponível.
   */
  private getFirstAvailable<TIn, TOut>(
    featureKey: keyof IntegrationsConfig,
  ): IntegrationAdapter<TIn, TOut> | null {
    const featureConfig = this.config[featureKey];
    if (!featureConfig.enabled) return null;

    // Se a config especifica um adapter id, tenta esse
    if (featureConfig.adapterId) {
      const adapter = this.adapters.get(featureConfig.adapterId);
      if (adapter?.isAvailable()) {
        return adapter as IntegrationAdapter<TIn, TOut>;
      }
      return null;
    }

    // Procura o primeiro adapter registado para esta feature
    for (const [adapterId, mappedKey] of this.featureMap.entries()) {
      if (mappedKey === featureKey) {
        const adapter = this.adapters.get(adapterId);
        if (adapter?.isAvailable()) {
          return adapter as IntegrationAdapter<TIn, TOut>;
        }
      }
    }
    return null;
  }

  // ─── Helpers específicos por domínio ─────────────────────────

  /** Validador de BI (MinFin, QR Code, OCR, etc.) */
  getBiValidator(): BiValidationAdapter | null {
    return this.getFirstAvailable("biValidation") as any;
  }

  /** Armazenamento de documentos (Supabase Storage, S3, etc.) */
  getDocumentStorage(): StorageAdapter | null {
    return this.getFirstAvailable("documentStorage") as any;
  }

  /** Integração bancária (API do banco para abertura de contas) */
  getBankingIntegration(): IntegrationAdapter<unknown, unknown> | null {
    return this.getFirstAvailable("banking");
  }

  /** Assinatura digital */
  getSigningIntegration(): IntegrationAdapter<unknown, unknown> | null {
    return this.getFirstAvailable("digitalSigning");
  }
}

/** Singleton do registry */
export const registry = new IntegrationsRegistry();
