import { PROVINCIAS_ANGOLA } from "@/lib/constants";

interface ProvinciaSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  placeholder?: string;
}

/**
 * Select reutilizável com a lista oficial das 18 províncias de Angola.
 *
 * Uso em formulários (name para FormData):
 *   <ProvinciaSelect name="provincia" required />
 *
 * Uso em filtros (value/onChange controlado):
 *   <ProvinciaSelect value={filtro} onChange={handleChange} className="px-4 py-2" />
 *
 * Navegação por teclado:
 *   O atributo `aria-label` é passado automaticamente para o <select> nativo.
 */
export function ProvinciaSelect({
  placeholder = "— Selecione a província —",
  className = "",
  ...props
}: ProvinciaSelectProps) {
  return (
    <select
      {...props}
      className={`w-full rounded-xl border border-bci-line bg-white px-4 py-3 font-medium outline-none focus:border-bci-pink focus:ring-4 focus:ring-pink-100 ${className}`}
    >
      <option value="">{placeholder}</option>
      {PROVINCIAS_ANGOLA.map((p) => (
        <option key={p} value={p}>
          {p}
        </option>
      ))}
    </select>
  );
}
