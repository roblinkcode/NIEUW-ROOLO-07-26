"""Run with python-liquid installed; checks schema, unchanged content, and editor mutations."""
import json,re,copy
from pathlib import Path
from html.parser import HTMLParser
from liquid import Environment,DictLoader
root=Path(__file__).resolve().parents[1]
def parse_json(s):return json.loads(re.sub(r'/\*.*?\*/','',s,flags=re.S))
template=parse_json((root/'templates/product.hond-achterbank-bescherme.json').read_text())
snippets={p.stem:p.read_text().replace('{% style %}','<style>').replace('{% endstyle %}','</style>')for p in (root/'snippets').glob('pawguard*.liquid')}
env=Environment(loader=DictLoader(snippets));env.add_filter('asset_url',lambda s:'/assets/'+s);env.add_filter('stylesheet_tag',lambda s:'<link href="'+s+'">')
ctx={'template':{'suffix':'hond-achterbank-bescherme'},'shop':{'shipping_policy':{'url':'/policies/shipping-policy'},'refund_policy':{'url':'/policies/refund-policy'}},'routes':{'root_url':'/'}}
class Content(HTMLParser):
 def __init__(self,s):super().__init__();self.text=[];self.images=[];self.skip=0;self.feed(s)
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag in ['style','script']:self.skip+=1
  if tag=='img':self.images.append((a.get('src'),a.get('alt')))
 def handle_endtag(self,tag):
  if tag in ['style','script']:self.skip-=1
 def handle_data(self,data):
  if not self.skip:self.text+=data.split()
for id,s in template['sections'].items():
 if not s['type'].startswith('pawguard-'):continue
 code=(root/'sections'/f"{s['type']}.liquid").read_text();schema=json.loads(code.split('{% schema %}')[1].split('{% endschema %}')[0]);assert len(schema['name'])<=25
 for settings in [schema['settings']]+[b.get('settings',[])for b in schema.get('blocks',[])]:
  ids=[x['id']for x in settings if 'id'in x];assert len(ids)==len(set(ids))
  for x in settings:
   if x['type']=='image_picker':assert 'default'not in x
   if x['type']=='range' and s['type']!='pawguard-main-product':assert x['min']<=x['default']<=x['max'] and (x['default']-x['min'])%x['step']==0
 assert set(s['settings'])<={x['id']for x in schema['settings']if 'id'in x}
 blocktypes={b['type']:b for b in schema.get('blocks',[])}
 for b in s.get('blocks',{}).values():
  if b['type'].startswith('shopify://'):continue
  assert set(b['settings'])<={x['id']for x in blocktypes[b['type']].get('settings',[])if 'id'in x}
 if s['type']=='pawguard-main-product':continue
 section=copy.deepcopy(s);section['id']=id;section['blocks']=[dict(s['blocks'][k],id=k)for k in s['block_order']]
 render=env.from_string(code.split('{% schema %}')[0]);actual=render.render(section=section,**ctx)
 part=s['type'].removeprefix('pawguard-');old=env.get_template('pawguard-content').render(part=part,**ctx)
 a,o=Content(actual),Content(old);assert a.text==o.text,(part,'content changed',a.text,o.text);assert a.images==o.images,(part,'images changed')
 section['settings']['title']='Bewerkte titel';assert 'Bewerkte titel'in render.render(section=section,**ctx)
 section['settings']['visible']=False;assert not render.render(section=section,**ctx).strip();section['settings']['visible']=True
 section['blocks'][0]['settings']['visible']=False;assert len(Content(render.render(section=section,**ctx)).text)<len(a.text)
 section['blocks'].reverse(); assert render.render(section=section,**ctx)
 assert not render.render(section=section,**dict(ctx,template={'suffix':'other'})).strip()
 print('PASS',part,'schema, exact initial text/images, editable title, hiding and scope')
assert "render 'pawguard-content'"not in json.dumps(template)
print('PASS: template has no Custom Liquid render dependencies')

# Image picker overrides the bundled fallback; hiding is controlled by the parent.
env.add_filter('image_url',lambda value,**kwargs:value['url'])
env.add_filter('image_tag',lambda value,**kwargs:'<img src="'+value+'" alt="'+kwargs['alt']+'">')
assert '/picked.jpg' in env.get_template('pawguard-editor-image').render(selected={'url':'/picked.jpg'},fallback='dimensions',alt='Selected image')
# Native product section is a faithful copy outside the three added editor blocks.
original=(root/'sections/main-product.liquid').read_text().split('{% schema %}')[0]
converted=(root/'sections/pawguard-main-product.liquid').read_text().split('{% schema %}')[0]
converted=converted.split('defer></script>\n',1)[1]
converted=re.sub(r"{%- when 'pawguard_title' -%}.*?(?={%- when 'custom_liquid' -%})",'',converted,flags=re.S)
assert converted==original, 'Native product functionality changed'
print('PASS image picker override and unchanged native product markup/logic')
