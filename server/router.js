const { getController } = require('./trafficControl')
const { format, verify } = require('./incomingRequests')

//This connects 
var router = function(req, res) {

	if(!verify(req)) {
		res.writeHead(401);
		return res.end('Hmm, try again?');
	}

	const formattedReq = format.initial(req);
	const controller = getController(formattedReq);
	if(!controller) {
		res.writeHead(404); 
		return res.end('Invalid Route');
	}
	let handleBody;
	//We don't want to do default body data gathering
	if(controller.streamBody) {
		handleBody = controller.handler(formattedReq, req);
	} 
	else {
		//Want whole body at once
		handleBody = format.attachBody(req, formattedReq)
			.then(()=>{
				return controller.handler(formattedReq);
			})
	}

  return handleBody
  	.then(handlerRes => {

  		//If our handler needs to set headers
  		if(controller.headers && handlerRes.headers) {
  			res.writeHead(200, handlerRes.headers);
  			res.write(handlerRes.body || "Ok");
  			return res.end();
  		}

			if(typeof handlerRes === 'object') {
				handlerRes = JSON.stringify(handlerRes);
			}
			res.writeHead(200);
			res.write(handlerRes ||  "Ok");
			res.end();
		})
		.catch(err => {
			res.writeHead(400);
			res.end(err.message);
		});
}


module.exports = router;
