

echo "Installing mosquitto"
apt install mosquitto -y
mosquitto_passwd -c /etc/mosquitto/password_file $1
#echo 'password_file /etc/mosquitto/password_file ' >> /etc/mosquitto/mosquitto.conf
systemctl restart mosquitto.service

echo "Installing IPFS"
wget https://dist.ipfs.io/go-ipfs/v0.11.0/go-ipfs_v0.11.0_linux-amd64.tar.gz
tar -xvzf go-ipfs_v0.11.0_linux-amd64.tar.gz
cd go-ipfs
bash install.sh
ipfs init

echo "Clean up"
rm -rf go-ipfs


echo "installing nodejs 16"
apt update -y
cd /opt
wget -c https://nodejs.org/dist/v16.13.2/node-v16.13.2-linux-x64.tar.xz
tar -xf node-v16.13.2-linux-x64.tar.xz
export PATH=/opt/node-v16.13.2-linux-x64/bin/:$PATH
npm install -g node-red
cd ~