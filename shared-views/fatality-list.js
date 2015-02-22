var __base = __base || '../',
    c = require(__base + 'shared-config/constants'),
    mongodb = require(__base + 'shared-utils/mongo-db'),

   	//move to constants
    DATABASE = 'fe';

function getModel (d, cb) {

    var DEFAULT_LIMIT = 10,
    	COLLECTION = 'fe';

    function getData(err, db, close){

        if(err){
            c.l('err', err);
            return;
        }

        var limit = parseInt(d.limit) || DEFAULT_LIMIT,
            page = parseInt(d.page),
            startAt = page * limit,
            collection = db.collection(COLLECTION),
            data = {
                page: page,
                limit: limit
            }

        function filterOptions(){
        	return {};
    	}

   		function queryFilter(){
        	return {};
    	}

    	function querySelect(){
        	return {
            	"value.subject.name" : true,
           		"value.subject.age" : true,
            	"value.subject.race" : true,
           		"value.subject.sex" : true,
           		"value.death.cause" : true,
            	"value.death.event.date" : true,
            	"value.location.state" : true
        	}
    	}

    	function querySort(){
        	return { 
            	"value.death.event.date" : -1
       		}
    	}

    	function buildModel(body, data){
        	return {
            	'body' : body,
            	'data' : data
        	}
    	}

        function getCount(countCb){
            
            collection
            .find(queryFilter(), querySelect())
            .count(function(err, count){

            	if(err){
            		cb(err);
            	}
                
                countCb(count);
            
            })
        
        }
        
        
        function getResults(count){

        	function render(err, model){

        		if(err){
            		c.l('err', err);
           			cb(err);
            	}

	        	cb(null, {
	            	results: model.body,
	           		count: model.data.count,
	            	filters: filterOptions(),
	            	locals: { 
	                	title: 'List of Fatalities',
	                	js: ['config/list'],
	                	css: ['list']
	            	}
	        	});

        		close();
    		}

            collection.find(queryFilter(), querySelect())

            .sort(querySort())

            .skip(startAt).limit(limit)
            
            .toArray(function(err, body){

                if(err){
            		c.l('err', err);
           			cb(err);
            	}

	        	cb(null, {
	            	results: body,
	           		count: count,
	            	filters: filterOptions()
	        	});

        		close();
            
            });
        }
        
        //init
        getCount(function(count){

            getResults(count);
        
        });
    }

    mongodb(DATABASE, getData);
}

module.exports = getModel;