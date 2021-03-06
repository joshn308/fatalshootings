var __base = __base || '../',
    c = require(__base + 'shared-config/constants'),
    log = c.getLog(c.log, 'shared-utils/render-view'),

	getView = require('./get-view');

function renderView (req, res, component, data, locals) {

	getView(component, data, function(err, view){

		if(err){

			log('error', 'could not get view', err);

			res.render('view', { 
        		'view' : "error"
    		});
		
		}


		log('trace', 'got view, calling res.render()');
		
		res.render('view', {
        	'view' : view.html,
        	'locals' : locals
    	});
	});
}

module.exports = renderView;