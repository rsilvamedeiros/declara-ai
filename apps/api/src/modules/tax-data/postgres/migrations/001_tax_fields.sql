-- Papel da aplicação: sem LOGIN próprio aqui, sem BYPASSRLS, sem ser dono da tabela.
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'declara_app') THEN
    CREATE ROLE declara_app NOLOGIN NOBYPASSRLS;
  END IF;
END
$$;

CREATE TABLE tax_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id text NOT NULL,
  person_id text NOT NULL,
  year integer NOT NULL CHECK (year BETWEEN 1000 AND 9999),
  key text NOT NULL CHECK (key <> ''),
  value_cents bigint,
  value_text text,
  previous_cents bigint,
  previous_text text,
  status text NOT NULL CHECK (status IN ('extracted', 'confirmed', 'corrected', 'rejected')),
  origin_kind text NOT NULL CHECK (origin_kind IN ('document', 'manual')),
  document_id text,
  page integer,
  excerpt text,
  entered_at text,
  CHECK ((value_cents IS NULL) <> (value_text IS NULL)),
  CHECK (previous_cents IS NULL OR previous_text IS NULL),
  CHECK (
    (origin_kind = 'manual' AND entered_at IS NOT NULL
      AND document_id IS NULL AND page IS NULL AND excerpt IS NULL)
    OR
    (origin_kind = 'document' AND document_id IS NOT NULL AND document_id <> ''
      AND page >= 1 AND excerpt IS NOT NULL AND excerpt <> '' AND entered_at IS NULL)
  )
);

CREATE INDEX tax_fields_owner_person_year ON tax_fields (owner_id, person_id, year);

ALTER TABLE tax_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_fields FORCE ROW LEVEL SECURITY;

-- Sem app.owner_id definido, current_setting devolve NULL e nenhuma linha passa.
CREATE POLICY tax_fields_owner ON tax_fields
  USING (owner_id = current_setting('app.owner_id', true))
  WITH CHECK (owner_id = current_setting('app.owner_id', true));

GRANT SELECT, INSERT, UPDATE ON tax_fields TO declara_app;
