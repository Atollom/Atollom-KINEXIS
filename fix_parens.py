import sys

with open('migrations/run_all_prod.sql', 'r', encoding='utf-8') as f:
    text = f.read()

# Fix the missing enclosing parentheses from my previous attempt
text = text.replace("USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid\nWITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid;", "USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)\nWITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);")

with open('migrations/run_all_prod.sql', 'w', encoding='utf-8') as f:
    f.write(text)

print("Parentheses fixed!")
