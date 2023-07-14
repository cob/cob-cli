IFS=$'\n'
SERVER=${1}
ENVIRONMENT=${2}
COBCLIPATH=${3}

echo "mkdir -p recordm/definitions/\\c"
mkdir -p recordm/definitions/

echo "rm -f recordm/definitions/$ENVIRONMENT\\c"
rm -f recordm/definitions/$ENVIRONMENT/*

DIR=recordm/definitions/$ENVIRONMENT
echo "mkdir -p $DIR"
mkdir -p $DIR

for def in $(ssh $SERVER "curl -sS -b ~/.cob-cookie http://localhost:40280/recordm/definitions" | jq .[] -c | node $COBCLIPATH/../../node_modules/cmd-line-importer/processor.js --transformer "JSON.stringify([entry.id,entry.name])"); do 
    echo " getting def: $def ...\\c"
    ssh $SERVER "curl -sS -b ~/.cob-cookie http://localhost:40280/recordm/definitions/$(echo $def | jq '.[0]')" | jq --sort-keys . | grep -v "\"defaultValue\":" > $DIR/$(echo $def | jq .[1] | tr -d '"').json    
done