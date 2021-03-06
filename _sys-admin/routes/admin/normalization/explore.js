var c = require(__base + 'config/constants');
var v = require(__base + 'db/utils/analysis_view');
var n = require(__base + 'db/utils/normalizer');

var express = require('express');
var router = express.Router();
var _ = require('underscore');


/* GET home page. */
router.get('/formatted/',function(req,res){
    v.get(function(body){
        res.json(body)
    });
});

router.get('/install/clean',function(req,res){
    var n = require('nano')(c.nano);
    var output = {title: '', message: '', actions: []};
    n.db.list(function(err,body){
        if(err) throw err;
        var found = false;
        body.forEach(function(db){
            if(db === 'pfc'){
                found = true;
            }
        });
        if(found){
            output.actions.push({label: 'Install Database',value: 'Failed to install database'});
            output.title = 'Error';
            output.message = 'The table "pfc" already exists';
            res.render('admin/normalization/explore/install',output);
        }else{
            //create table
            n.db.create('pfc',function(err,body){
                if(err) throw err;

                var pfc = n.use('pfc');
                
                //set output
                output.actions.push({label: 'Install Database',value: 'Installed database'});
                output.title = 'Success';
                output.message = 'The table "pfc" did not exist, so we created it for you.';
                
                //create view
                pfc.insert(
                    {'views': 
                        {'all': 
                            {'map': function(doc){
                                emit(doc._id,doc.value);;
                            }}
                        } 
                    }, 
                    '_design/basic',
                    function(err,body){
                        if(err) throw err;
                        output.actions.push({label: 'Create View','value': 'Success'});
                        output.message +=' We created a basic view for easier access.';
                        //import results
                        v.get(function(results){
                            if(typeof results !== 'undefined'){
                                var clean = norm.cleanResults(results);

                                //update output
                                output.actions.push({label: 'Pull old rows', value: 'Grabbed '+results.total_rows+' rows'});
                                output.actions.push({label: 'Cleaned old rows', value: 'Cleaned '+clean.total_rows+' rows'});
                                output.message += ' We grabbed '+results.total_rows+' from the old database and turned that into '+clean.total_rows+' clean entries.';

                                //insert rows
                                _.each(clean.rows, function(item){
                                    var id = item.id;
                                    delete item._dmair;
                                    delete item.id;
                                    delete item.key;
                                    pfc.insert(item, id,  function(err, body, header) {
                                        if (err) {
                                            console.log('[pf.insert] ', err.message);
                                            return;
                                        }
                                    });                                
                                });
                                output.actions.push({label: 'Inserted rows into new table',value: clean.rows.length});
                                output.message += ' We are now inserting all the clean rows into the database for you, this process takes a minute so it is still going, you can check your console for errors.';
                                res.render('admin/normalization/explore/install',output);
                            }else{
                                output.actions.push({label: 'Pull old rows', value: 'Failed to grab data'});
                                output.title = "Error";
                                output.message = 'We created the table for you, however we were unable to pull results from the original table for importing';
                                res.render('admin/normalization/explore/install',output);
                            }
                        })
                    }
                );
            });
            
        }
        
    });
});

router.get('/normalized/compare/:id',function(req,res){
    var p = {keys: []};
    if(req.params.id.indexOf(',')){
        p.keys = req.params.id.split(',');
    }else{
        p.keys.push(req.params.id);
    }
    v.get(function(body){
        if(typeof body !== 'undefined'){
            var nano = require('nano')(c.nano);
            var pf = nano.use('pf');
            var k = {keys: _.map(body.rows, function(row){ return row.key; })};
            pf.fetch(k, {}, function(err, data){
                if(err) throw err;
                if(typeof data !== undefined){
                    var clean = n.cleanResults(body)
                    var output = _.map(data.rows,function(element,index){
                        return {
                            orig: element,
                            dirty: body.rows[index],
                            clean: clean.rows[index]
                        }
                    });
                    res.render('admin/normalization/explore/compare',{results: output });
                }else{
                    console.log('not fetch',data);
                }
            });
        }else{
            console.log('bad body',body);
        }
    },0,p);
});

router.get('/normalized/specific/:id',function(req,res){
    var params = {keys: []};
    if(req.params.id.indexOf(',')){
        params.keys = req.params.id.split(',');
    }else{
        params.keys.push(req.params.id);
    }
    v.get(function(body){
        if(typeof body !== 'undefined'){
            var output = {
                orig: body,
                clean: n.cleanResults(body),
            }
            res.json(output);
        }else{
            console.log('bad body',body);
        }
    },0,params);
    
});

router.get('/normalized/',function(req,res){
    v.get(function(body){
        res.json(n.cleanResults(body))
    });
});

module.exports = router;