from pathlib import Path
import re,json
cloud=Path(__file__).resolve().parent;root=cloud.parent/'LuxPowerListener';work=cloud
def expand(path):
    return re.sub(r'#include "([^\"]+)"',lambda m:expand(root/m[1]),path.read_text())
def page(name):
    s=expand(root/name)
    return ''.join(m[2] for m in re.finditer(r'R"([A-Za-z0-9_]*)\((.*?)\)\1"',s,re.S)).replace('__CHIP__','ESP32').replace('__FW_VERSION__','2.6.0')
dashboard=page('LuxFlow.h')
dashboard=re.sub(r'<form id="fwUploadForm".*?</form>','',dashboard,flags=re.S)
dashboard=dashboard.replace('Chọn kiểm tra online hoặc tải file .bin offline bên dưới.','Kiểm tra và cập nhật online qua ESP32.').replace('Chọn kiểm tra online hoặc tải file .bin offline.','Kiểm tra và cập nhật online qua ESP32.').replace('bằng file .bin trong mạng nội bộ hoặc qua Internet.','qua Internet bằng manifest đã cài trên ESP32.')
registers=page('LuxRegisterPage.h')
def jsjson(s):return json.dumps(s,ensure_ascii=False).replace('<',r'\u003c').replace('\u2028',r'\u2028').replace('\u2029',r'\u2029')
vendor=(work/'vendor/mqtt.min.js').read_text().replace('</script','<\\/script')
bundles='<script>window.SOLAR_DASHBOARD='+jsjson(dashboard)+';window.SOLAR_REGISTERS='+jsjson(registers)+';</script>'
html=(cloud/'cloud-shell.html').read_text().replace('<!-- CLOUD_VENDOR -->','<script>/* MQTT.js 5.10.4\n'+(cloud/'MQTT_LICENSE.md').read_text().replace('*/','* /')+'\n*/\n'+vendor+'</script>').replace('<!-- CLOUD_BUNDLES -->',bundles).replace('<!-- CLOUD_SCRIPT -->','<script>\n'+(cloud/'cloud.js').read_text()+'\n</script>')
(cloud/'index.html').write_text(html)

print('Standalone index.html:',len(html),'bytes; shared dashboard:',len(dashboard),'registers:',len(registers))
