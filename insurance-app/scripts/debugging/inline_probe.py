import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE','insurance.settings')
import django
django.setup()
from django.urls import get_resolver

resolver = get_resolver()
paths = []
def walk(pattern, prefix=''):
    from django.urls.resolvers import URLResolver, URLPattern
    if isinstance(pattern, URLPattern):
        paths.append(prefix + str(pattern.pattern))
    elif isinstance(pattern, URLResolver):
        for p in pattern.url_patterns:
            walk(p, prefix + str(pattern.pattern))

for p in resolver.url_patterns:
    walk(p, '')

for p in sorted(paths):
    if 'quote' in p.lower():
        print(p)