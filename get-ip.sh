echo -e "\nVPS_IP=$(ipconfig getifaddr en0)" >> .env
echo -e "\nDB_HOST=$(ipconfig getifaddr en0)" >> .env

