#!/bin/bash
Blue='\033[1;36m'         # Blue
Yellow='\033[0;33m'         # Yellow
NC='\033[0m'

# cd ../frontend
npm run build
cp -r ./build/ ../wedding-website-build/
cd ../wedding-website-build/
npm ci --omit dev
scp -r -o "ProxyJump michael@mabrodis.ddns.net:5678" * michael@192.168.1.216:~/wedding_site

# scp -r -o "ProxyJump michael@mabrodis.ddns.net:5678" ./build/* michael@192.168.1.216:~/wedding_site

ssh michael@mabrodis.ddns.net -p 5678
ssh 192.168.1.216

sudo cp -r /home/michael/wedding_site/* /opt/wedding_site/build

echo -e "${Blue}Restarting Maker Frontend service${NC}"
systemctl restart wedding_site

echo -e "${Blue}Tailing Logs . . . ${NC}"
journalctl -f -u wedding_sit




