const http = require("http");
const MongoClient = require("mongodb").MongoClient;
const port = 8080;
const mongoClient = new MongoClient("mongodb://localhost:27017/", { useUnifiedTopology: true });

http.createServer(async function(req, res){
    if(req.method == "POST"){
        let body='';
        req.on('data', data => {
            body += data;
        });
        req.on('end',() => {
            let date = new Date();
            try{
                body = JSON.parse(body)
            }catch (err){
                console.log("json parse error")
                return;
            }
            let obj_data = {
                type: Boolean(body.entry.toLowerCase() == "true")?"entry":"attempt",
                date: date.getFullYear()+"."+((date.getMonth()+1)<10?"0"+(date.getMonth()+1):"(date.getMonth()+1)")+"."+(date.getDate()<10?"0"+date.getDate():date.getDate()),
                time: (date.getHours()<10?"0"+date.getHours():date.getHours())+":"+(date.getMinutes()<10?"0"+date.getMinutes():date.getMinutes())+":"+(date.getSeconds()<10?"0"+date.getSeconds():date.getSeconds()),
            }
            console.log("Code lock: "+Number(body.id)+", "+obj_data.type+"");
            mongoClient.connect(async function(err, client){
                const collection = client.db("test").collection("code_logs");
                await collection.findOne({lock_id: Number(body.id)},(err,res)=>{
                    if(err){ 
                        return console.log(err);
                    }
                    if(!res){
                        console.log('insert')
                        collection.insertOne({lock_id: Number(body.id),data: [obj_data]}, (err, res)=>{
                            if(err){ 
                                return console.log(err);
                            }
                            console.log('insered');
                        });
                    }else{
                        res.data?res.data.push(obj_data):res.data = [obj_data]
                        collection.updateOne({lock_id:Number(body.id)},{$set: {data: res.data}}, (err, res)=>{
                            if(err){ 
                                return console.log(err);
                            }
                            console.log('updated');
                        });
                    }
                })
            });
            res.writeHead(200);
        });
    }
    res.end();
}).listen(port,()=>{
    console.log('http://127.0.0.1'+':'+port);
});