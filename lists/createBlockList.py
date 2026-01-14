# use this file to create your own block lists
import re

FILE_TO_PARSE = "CHANGE_ME.txt"
FILE_OUTPUT = "lists/blacklists/CHANGE_ME.txt"

# open source file and read each line
with open(FILE_TO_PARSE, 'r', encoding='utf-8') as f:
    l = f.readlines()

us = set()

# only capture: subdomain.domain.tld for any malicious request
for u in l:
    m = re.search(r'[a-z]+\.[a-z]+\.[a-z]+', u)
    if m: us.add(m.group(0))

# Write the stripped URLs to a new file
with open(FILE_OUTPUT, 'w') as f:
    for u in us:
        f.write(u + '\n')