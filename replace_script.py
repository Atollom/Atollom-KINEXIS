import sys
import re

with open('migrations/run_all_prod.sql', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace SELECT vault.create_secret(...) with comments
# using a regex that handles multiline up to the closing parenthesis
comment_replacement = '''-- NOTA: Configurar secrets via Supabase Dashboard
-- Settings -> Vault -> Add Secret
-- Key: [nombre_del_secret]'''

text = re.sub(r'SELECT\s+vault\.create_secret\s*\([^;]*\);', comment_replacement, text, flags=re.IGNORECASE)

# Split by lines to remove specific lines referencing vault.secrets
lines = text.split('\n')
new_lines = []
for line in lines:
    lower_line = line.lower()
    
    # Exclude any line referencing vault.secrets
    if 'vault.secrets' in lower_line:
        continue
    
    # Exclude CREATE POLICY on vault.secrets (already covered by string check but just in case)
    if 'create policy' in lower_line and ' vault.secrets' in lower_line:
        continue
        
    # Exclude alter table vault.secrets
    if 'alter table vault.secrets' in lower_line:
        continue
        
    # Exclude comment on table vault.secrets
    if 'comment on table vault.secrets' in lower_line:
        continue

    # Exclude any operation on schema vault.
    if 'schema vault' in lower_line or 'schema "vault"' in lower_line:
        continue

    new_lines.append(line)

new_text = '\n'.join(new_lines)

with open('migrations/run_all_prod.sql', 'w', encoding='utf-8') as f:
    f.write(new_text)

print('Vault cleanup done!')
