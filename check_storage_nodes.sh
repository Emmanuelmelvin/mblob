# Check which ports the storage nodes are actually using
docker exec mblob-storage-node-1-1 env | grep STORAGE_NODE_PORT
docker exec mblob-storage-node-2-1 env | grep STORAGE_NODE_PORT
docker exec mblob-storage-node-3-1 env | grep STORAGE_NODE_PORT

# Also check if they are listening on localhost in addition to the mapped port
docker exec mblob-storage-node-1-1 ls -l /data
docker exec mblob-storage-node-2-1 ls -l /data
docker exec mblob-storage-node-3-1 ls -l /data

# Check if storage-node is listed as available from gateway
docker exec mblob-gateway-1 curl -s http://localhost:3000/api/health/storage-nodes | jq ."