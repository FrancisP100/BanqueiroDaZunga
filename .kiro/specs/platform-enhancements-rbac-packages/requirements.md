# Requirements Document

## Introduction

This document specifies requirements for critical platform enhancements to the BanqueiroDaZunga field banking management system. The system currently suffers from access control issues, incorrect package structuring, and missing features for password management, leader-banqueiro synchronization, GPS-based market tracking, and administrative reporting.

These enhancements will fix security vulnerabilities, improve operational workflows for admins and líderes, and restructure the package system to match business requirements.

## Glossary

- **System**: The BanqueiroDaZunga web application (Next.js frontend and Supabase backend)
- **Admin**: User with administrative privileges who manages the entire platform
- **Líder**: User with leadership role (stored as "chefe" in database) who manages banqueiros in their assigned balcão
- **Banqueiro**: Field worker who opens accounts, sells packages, and marks presence at markets
- **Balcão**: Branch office identifier used to group banqueiros and líderes
- **Package**: Product offering sold to clients — one unified type named "Zungueira" with 4 classes
- **Zungueira_Package**: The unified package type that contains 4 classes: Mãezinha, Mãe, Mãe Grande, Mamoite
- **Package_Class**: One of the four sub-options within Zungueira: Mãezinha, Mãe, Mãe Grande, Mamoite
- **Market**: Physical location (mercado) where banqueiros work
- **Presence**: Daily attendance record for a banqueiro at a market
- **Initial_Password**: Temporary password provided by admin to new banqueiros at account creation
- **GPS_Coordinates**: Latitude and longitude captured from banqueiro device (latitude -90 to 90, longitude -180 to 180)
- **Province**: Administrative region (província) used for hierarchical filtering
- **Auth_System**: Supabase authentication service
- **Profile_Table**: Database table storing user profile information
- **Market_Table**: Database table storing market information including GPS coordinates
- **Presence_Table**: Database table storing daily presence records
- **requires_password_change**: Boolean flag on profiles table indicating first-login password change is required
- **iPhone_7_Login_Bug**: Current issue where login page reloads instead of redirecting to dashboard on iPhone 7 devices

## Requirements

### Requirement 1: iPhone 7 Login Bug Fix

**User Story:** As a banqueiro using iPhone 7, I want the login page to redirect me to the dashboard after successful authentication, so that I can access the system.

#### Acceptance Criteria

1. WHEN a banqueiro submits valid credentials on any device including iPhone 7, THE System SHALL authenticate the user and redirect without a full page reload
2. WHEN authentication succeeds, THE System SHALL redirect the banqueiro to the /banqueiro dashboard
3. WHEN authentication fails, THE System SHALL display an inline error message without a full page reload
4. WHEN a líder submits valid credentials, THE System SHALL redirect to /chefe dashboard
5. WHEN an admin submits valid credentials, THE System SHALL redirect to /admin dashboard
6. THE System SHALL use router.push (client-side navigation) instead of window.location for post-login redirect to preserve session state on iOS Safari

### Requirement 2: Presence Management Access Control

**User Story:** As a system administrator, I want presence management to be admin-only, so that líderes cannot modify attendance records.

#### Acceptance Criteria

1. THE System SHALL restrict presence record creation to Admin users only
2. THE System SHALL restrict presence record updates to Admin users only
3. THE System SHALL restrict presence record deletion to Admin users only
4. WHEN a líder attempts to create, update, or delete a presence record, THE System SHALL reject the request with an error indicating insufficient permissions
5. WHILE a líder is authenticated, THE System SHALL omit presence record creation, update, and deletion controls from the user interface
6. WHILE a líder is authenticated, THE System SHALL display presence data in read-only mode without modification controls

### Requirement 3: Package Structure Restructuring

**User Story:** As a business stakeholder, I want packages restructured from 4 separate types to 1 unified Zungueira package with 4 classes, so that the system reflects our actual product offering.

#### Acceptance Criteria

1. THE System SHALL define a single package type named "Zungueira"
2. THE Zungueira_Package SHALL contain exactly 4 Package_Class values: Mãezinha, Mãe, Mãe Grande, Mamoite
3. WHEN creating an account, THE System SHALL require selection of one Package_Class from the 4 available options
4. WHEN creating an account, THE System SHALL reject submission if no Package_Class is selected
5. THE System SHALL display the selected package in UI as "Zungueira — [Class]" format (e.g. "Zungueira — Mãezinha")
6. WHEN an existing account record has a legacy package value, THE System SHALL display it mapped to the new format until migration is complete
7. WHEN migration runs on existing accounts, THE System SHALL update all pacote column values to use "Zungueira — [Class]" format and preserve all other account fields unchanged

### Requirement 4: Initial Password Management

**User Story:** As an admin, I want to provide initial passwords to new banqueiros, so that I control account creation security.

#### Acceptance Criteria

1. WHEN Admin creates a new banqueiro profile, THE System SHALL require an Initial_Password value in the creation form
2. WHEN Admin submits the creation form, THE System SHALL store the Initial_Password via Auth_System password hashing (never as plaintext)
3. WHEN Admin submits the creation form, THE System SHALL set the requires_password_change flag to true on the new profile
4. WHEN Admin submits an Initial_Password shorter than 8 characters, THE System SHALL reject the form with a validation error indicating minimum length
5. WHEN Admin submits an Initial_Password longer than 128 characters, THE System SHALL reject the form with a validation error indicating maximum length
6. WHEN banqueiro account creation succeeds, THE System SHALL display the Initial_Password to the Admin in the creation response so they can communicate it to the banqueiro

### Requirement 5: Forced Password Change on First Login

**User Story:** As a banqueiro receiving an initial password, I want to be forced to change it on first login, so that only I know my password.

#### Acceptance Criteria

1. WHEN a banqueiro authenticates and their profile has requires_password_change set to true, THE System SHALL redirect them to /banqueiro/alterar-senha
2. WHILE a banqueiro has requires_password_change set to true, THE System SHALL block navigation to all routes except /banqueiro/alterar-senha and redirect back to that page
3. WHEN a banqueiro submits a new password shorter than 8 characters, THE System SHALL reject with a validation error
4. WHEN a banqueiro submits a new password longer than 128 characters, THE System SHALL reject with a validation error
5. WHEN a banqueiro submits a new password that does not match the confirmation field, THE System SHALL reject with a validation error
6. WHEN a banqueiro submits a new password identical to the password originally assigned at account creation, THE System SHALL reject with an error message stating the new password must differ from the initial one
7. WHEN password change succeeds, THE System SHALL set requires_password_change to false on the profile
8. WHEN password change succeeds, THE System SHALL redirect the banqueiro to /banqueiro dashboard
9. WHEN the password change server request fails, THE System SHALL display an error message and keep the banqueiro on /banqueiro/alterar-senha

### Requirement 6: Líder Balcão Requirement

**User Story:** As a system administrator, I want all líderes to have an assigned balcão, so that data scoping works correctly.

#### Acceptance Criteria

1. WHEN Admin creates a líder profile, THE System SHALL require the numero_balcao field to contain at least 1 non-whitespace character and at most 50 characters
2. IF Admin submits líder registration with numero_balcao absent, empty, or containing only whitespace, THE System SHALL reject with a validation error identifying the numero_balcao field
3. THE System SHALL validate that a stored numero_balcao value contains at least 1 non-whitespace character and at most 50 characters
4. IF Admin submits a líder profile update with numero_balcao set to null, empty, or whitespace-only, THE System SHALL reject the update with a validation error
5. WHEN Admin submits a líder profile update with a nuevo numero_balcao value of 1–50 non-whitespace characters, THE System SHALL persist the new value

### Requirement 7: Automatic Banqueiro-Líder Synchronization

**User Story:** As a líder registering with a balcão number, I want the system to automatically link all banqueiros from that balcão to me, so that I can manage my team immediately.

#### Acceptance Criteria

1. WHEN a líder is created with a numero_balcao value, THE System SHALL query all banqueiro profiles where numero_balcao matches and create an association record for each matching banqueiro
2. WHEN a líder's numero_balcao is updated, THE System SHALL delete all existing associations for that líder
3. WHEN a líder's numero_balcao is updated, THE System SHALL create new associations for all banqueiro profiles matching the new numero_balcao value
4. IF no banqueiro profiles match the líder's numero_balcao at registration or update time, THE System SHALL complete without error and record 0 associations created
5. WHEN synchronization completes, THE System SHALL log the líder id, balcao value, and count of associations created

### Requirement 8: Líder Data Scope Enforcement

**User Story:** As a líder, I want to see only data from banqueiros in my balcão, so that I focus on my assigned team.

#### Acceptance Criteria

1. WHEN a líder requests the banqueiro list, THE System SHALL return only banqueiro profiles where numero_balcao matches the líder's numero_balcao
2. WHEN a líder requests accounts data, THE System SHALL return only accounts whose banqueiro_id belongs to a banqueiro with the same numero_balcao as the líder, joined via the profiles table
3. WHEN a líder requests presences data, THE System SHALL return only presence records whose profile_id belongs to a banqueiro with the same numero_balcao as the líder
4. IF a líder requests a specific resource (banqueiro, account, presence) belonging to a different balcão, THE System SHALL return an empty result or 404 response
5. WHEN a líder has no numero_balcao assigned, THE System SHALL return an empty result set for all scoped queries
6. IF a líder has no numero_balcao assigned, THE System SHALL display a configuration warning in the líder dashboard

### Requirement 9: GPS Capture on First Presence

**User Story:** As a banqueiro marking presence for the first time at a market, I want the system to capture and save the GPS coordinates of my location, so that the market has accurate coordinates in the database.

#### Acceptance Criteria

1. WHEN a banqueiro submits a presence record and the assigned market has no GPS_Coordinates stored, THE System SHALL request device GPS_Coordinates with a timeout of 10 seconds before saving the presence record
2. WHEN GPS_Coordinates are successfully captured, THE System SHALL save latitude (6 decimal places) and longitude (6 decimal places) to the Market_Table row for that market
3. IF the GPS request times out or the user denies permission, THE System SHALL still save the presence record and display a non-blocking warning that GPS capture failed
4. WHEN a market already has non-null latitude and longitude in Market_Table, THE System SHALL not overwrite those values on subsequent presence submissions
5. IF the captured latitude is outside the range -90 to 90, THE System SHALL reject the GPS value, save the presence record without coordinates, and display a validation warning
6. IF the captured longitude is outside the range -180 to 180, THE System SHALL reject the GPS value, save the presence record without coordinates, and display a validation warning

### Requirement 10: Admin Dashboard Restructuring

**User Story:** As an admin, I want the dashboard to show General Statistics instead of Performance Reports, so that I see relevant platform-wide metrics immediately.

#### Acceptance Criteria

1. THE System SHALL remove the "Performance Reports" section from the admin dashboard page
2. THE System SHALL add a "General Statistics" section to the admin dashboard page
3. WHEN the admin dashboard loads, THE System SHALL display the total count of accounts with status="aberta" as "Contas Abertas"
4. WHEN the admin dashboard loads, THE System SHALL display the total count of accounts with status="aberta" as "Pacotes Vendidos" (each open account = 1 package sold)
5. WHEN the admin dashboard loads, THE System SHALL display the total count of accounts where tpa_status="entregue" as "TPAs Entregues"
6. WHEN any statistic count is zero, THE System SHALL display "0" rather than hiding the metric

### Requirement 11: Hierarchical Administrative Filters

**User Story:** As an admin, I want to filter dashboard statistics by Province → Balcão → Market hierarchy, so that I can drill down into specific regions.

#### Acceptance Criteria

1. THE System SHALL display a Province filter dropdown populated with unique provincia values from the markets table, sorted alphabetically
2. WHEN Admin selects a Province, THE System SHALL populate the Balcão filter with unique balcao values from markets in that province, sorted alphabetically
3. WHEN Admin selects a Balcão, THE System SHALL populate the Market filter with market names in that balcão, sorted alphabetically
4. IF a filter level has no results (e.g. no balcões in selected province), THE System SHALL disable the dependent downstream dropdowns
5. WHEN Admin applies any filter combination, THE System SHALL update the General Statistics counts to reflect only data matching the selected scope
6. WHEN Admin clears all filters, THE System SHALL display unfiltered global statistics
7. THE System SHALL store active filter selections in URL query parameters so they persist on page refresh within the admin section

### Requirement 12: Administrative Reporting by Province

**User Story:** As an admin, I want to generate reports filtered by province and date range, so that I can analyze regional performance.

#### Acceptance Criteria

1. THE System SHALL provide a province selection dropdown in the admin reports interface populated from the markets table
2. WHEN Admin selects a province and a date range (start date, end date), THE System SHALL filter all report data to accounts created within that date range in markets belonging to that province
3. WHEN Admin selects a province and date range, THE System SHALL display the count of accounts with status="aberta" for that scope
4. WHEN Admin selects a province and date range, THE System SHALL display the count of accounts with status="aberta" as packages sold for that scope
5. WHEN Admin selects a province and date range, THE System SHALL display the count of accounts with tpa_status="entregue" for that scope
6. WHEN Admin clicks the export button with a province filter active, THE System SHALL generate a CSV file containing the filtered report data
7. WHEN no province is selected, THE System SHALL aggregate data across all provinces

### Requirement 13: Administrative Reporting by Market

**User Story:** As an admin, I want to generate reports filtered by market and date range, so that I can analyze individual market performance.

#### Acceptance Criteria

1. THE System SHALL provide a market selection dropdown in the admin reports interface
2. WHEN Admin selects a market and a date range, THE System SHALL filter all report data to accounts linked to that mercado_id within the date range
3. WHEN Admin selects a market and date range, THE System SHALL display the count of accounts with status="aberta" for that market
4. WHEN Admin selects a market and date range, THE System SHALL display the count of accounts with status="aberta" as packages sold for that market
5. WHEN Admin selects a market and date range, THE System SHALL display the count of accounts with tpa_status="entregue" for that market
6. IF the selected market has non-null GPS_Coordinates in Market_Table, THE System SHALL display the latitude and longitude values
7. IF the selected market has null GPS_Coordinates, THE System SHALL display "Coordenadas não disponíveis"

### Requirement 14: Administrative Reporting by Banqueiro

**User Story:** As an admin, I want to generate reports filtered by banqueiro and date range, so that I can analyze individual performance.

#### Acceptance Criteria

1. THE System SHALL provide a banqueiro selection dropdown in the admin reports interface
2. WHEN Admin selects a banqueiro and a date range, THE System SHALL filter all report data to accounts where banqueiro_id matches within the date range
3. WHEN Admin selects a banqueiro and date range, THE System SHALL display the count of accounts with status="aberta" for that banqueiro
4. WHEN Admin selects a banqueiro and date range, THE System SHALL display the count of accounts with status="aberta" as packages sold for that banqueiro
5. WHEN Admin selects a banqueiro and date range, THE System SHALL display the count of accounts with tpa_status="entregue" for that banqueiro
6. WHEN Admin selects a banqueiro, THE System SHALL display the count of days in the current calendar month where a presence record exists for that banqueiro versus the total working days in that month

### Requirement 15: Administrative Reporting by Balcão

**User Story:** As an admin, I want to generate reports filtered by balcão and date range, so that I can analyze branch performance.

#### Acceptance Criteria

1. THE System SHALL provide a balcão selection dropdown in the admin reports interface populated from unique numero_balcao values in profiles
2. WHEN Admin selects a balcão and a date range, THE System SHALL filter report data to accounts created by banqueiros whose numero_balcao matches within the date range
3. WHEN Admin selects a balcão and date range, THE System SHALL display the count of accounts with status="aberta" for that balcão
4. WHEN Admin selects a balcão and date range, THE System SHALL display the count of accounts with status="aberta" as packages sold for that balcão
5. WHEN Admin selects a balcão and date range, THE System SHALL display the count of accounts with tpa_status="entregue" for that balcão
6. WHEN Admin selects a balcão, THE System SHALL display the count of banqueiro profiles with ativo=true and numero_balcao matching that balcão

### Requirement 16: Administrative Reporting by Líder

**User Story:** As an admin, I want to generate reports filtered by líder and date range, so that I can analyze team leader performance.

#### Acceptance Criteria

1. THE System SHALL provide a líder selection dropdown in the admin reports interface listing all profiles with papel="chefe"
2. WHEN Admin selects a líder and a date range, THE System SHALL filter report data to accounts created by banqueiros whose numero_balcao matches the selected líder's numero_balcao within the date range
3. WHEN Admin selects a líder and date range, THE System SHALL display the count of accounts with status="aberta" for that líder's team
4. WHEN Admin selects a líder and date range, THE System SHALL display the count of accounts with status="aberta" as packages sold for that líder's team
5. WHEN Admin selects a líder and date range, THE System SHALL display the count of accounts with tpa_status="entregue" for that líder's team
6. WHEN Admin selects a líder, THE System SHALL display the count of banqueiro profiles with ativo=true and numero_balcao matching the líder's numero_balcao

### Requirement 17: Admin Global Oversight

**User Story:** As an admin, I want to see aggregated data from all líderes and banqueiros on the platform, so that I have complete visibility without scope restrictions.

#### Acceptance Criteria

1. WHEN the admin dashboard loads without filters, THE System SHALL display the all-time cumulative total of accounts with status="aberta" across the entire platform
2. WHEN the admin dashboard loads without filters, THE System SHALL display the all-time cumulative total of accounts with status="aberta" as packages sold across the entire platform
3. WHEN the admin dashboard loads without filters, THE System SHALL display the all-time cumulative total of accounts with tpa_status="entregue" across the entire platform
4. WHEN Admin navigates to a líder's profile page, THE System SHALL display that líder's balcão, assigned banqueiro count, and team-level account statistics
5. WHEN Admin navigates to a banqueiro's profile page, THE System SHALL display that banqueiro's accounts, presence history, and TPA statistics
6. WHEN an Admin user makes any data query, THE System SHALL return results without applying balcão or province scope restrictions

### Requirement 18: Database Schema Migration for Packages

**User Story:** As a database administrator, I want a migration script to convert existing package data to the new Zungueira format, so that no data is lost during restructuring.

#### Acceptance Criteria

1. WHEN the migration script is executed, THE System SHALL update all accounts rows where pacote = "Mãezinha" to pacote = "Zungueira — Mãezinha"
2. WHEN the migration script is executed, THE System SHALL update all accounts rows where pacote = "Mãe" to pacote = "Zungueira — Mãe"
3. WHEN the migration script is executed, THE System SHALL update all accounts rows where pacote = "Mãe Grande" to pacote = "Zungueira — Mãe Grande"
4. WHEN the migration script is executed, THE System SHALL update all accounts rows where pacote = "Mamoite" to pacote = "Zungueira — Mamoite"
5. WHEN migration completes successfully, THE System SHALL output a log entry containing the count of rows updated per mapping
6. WHEN migration completes successfully, THE System SHALL notify the operator with a success message
7. IF the migration encounters a database error, THE System SHALL rollback all changes made in that migration run and output an error message with the failure reason

### Requirement 19: Líder-Banqueiro Association Table

**User Story:** As a system architect, I want a database table to track líder-banqueiro associations, so that the synchronization system and scoped queries work correctly.

#### Acceptance Criteria

1. THE System SHALL create a leader_banqueiro_associations table with columns: id (uuid primary key), leader_id (uuid not null), banqueiro_id (uuid not null), balcao (text), created_at (timestamptz default now())
2. THE Table SHALL enforce a unique constraint on the (leader_id, banqueiro_id) pair
3. THE Table SHALL have a foreign key from leader_id to profiles(id) with ON DELETE CASCADE
4. THE Table SHALL have a foreign key from banqueiro_id to profiles(id) with ON DELETE CASCADE
5. WHEN an insert is attempted with a (leader_id, banqueiro_id) pair that already exists, THE System SHALL reject the insert without error (ignore duplicate)

### Requirement 20: Password Change Audit Logging

**User Story:** As a security administrator, I want password change events logged, so that I can audit security compliance.

#### Acceptance Criteria

1. WHEN a banqueiro successfully changes their password, THE System SHALL write a log entry containing: user_id, event_type="password_changed", timestamp (UTC), and IP address of the request
2. WHEN a banqueiro's password change attempt fails validation, THE System SHALL write a log entry containing: user_id, event_type="password_change_failed", timestamp (UTC), IP address, and the validation failure reason
3. WHEN the audit log write itself fails, THE System SHALL still complete the password change operation and log the audit failure to the server error log
4. THE System SHALL retain audit log entries for a minimum of 90 days before they may be purged
