"use strict";
exports = module.exports = function(server){
  var ERR = require('node-restify-errors');
  var moment = require('moment');
  var dz = require('./user.devzone.js');
  /**
   * @api {get} /devzone/user GetUser
   * @apiName GetUser
   * @apiGroup DevZone
   * @apiHeader {String} auth Votre cookie de connexion.
   */
  server.get('/devzone/user', function (req, res, next) {
    dz.user(server, req.headers.auth,function(user){
      return res.send({
        username:    user.username,
        uid:         user.uid,
        gid:         user.gid,
        accesslevel: user.accesslevel,
        accessname:  user.accessname
      });
    });
    next();
  });
  
  /**
   * @api {get} /devzone/status GetStatus
   * @apiName GetStatus
   * @apiGroup DevZone
   * @apiHeader {String} auth Votre cookie de connexion.
   */
  server.get('/devzone/status', function (req, res, next) {
    var cache = server.cache.get( req._url.pathname);
    if( cache != undefined ) { return res.send(cache); }
    
    var sql = "SELECT S.stat_id, S.stat_name, S.stat_priority, UNIX_TIMESTAMP(S.stat_date), S.stat_hidden FROM `leeth`.dz_status S ORDER BY stat_hidden ASC,stat_priority DESC";
    server.conn.query(sql, [], function(err, rows){
      if( err ) throw err;
      server.cache.set( req._url.pathname, rows);
      return res.send(rows);
    });
    next();
  });
  
  /**
   * @api {get} /devzone/ticket GetTickets
   * @apiName GetTickets
   * @apiGroup DevZone
   * @apiHeader {String} auth Votre cookie de connexion.
   */
  server.get('/devzone/ticket', function (req, res, next) {
    dz.user(server, req.headers.auth,function(user){
      var cache = server.cache.get( req._url.pathname+'-'+user.accesslevel );
      if( cache != undefined ) { return res.send(cache); }
      
      var sql = "SELECT S.stat_id, tk_id, tk_title, usr_id, assig_usr_id, tk_desc, tk_showdesc, T.cat_id, tk_url FROM `leeth`.dz_status S "
        +"LEFT JOIN `leeth`.dz_ticket T ON T.stat_id = S.stat_id "
	      +"LEFT JOIN `leeth`.dz_cat C ON T.cat_id = C.cat_id "
	      +"WHERE C.cat_minacc <= ? AND "
	      +"S.stat_id IN(SELECT * FROM (SELECT S.stat_id FROM `leeth`.dz_status S ORDER BY stat_hidden ASC,stat_priority DESC LIMIT 4) AS temp) "
	      +"ORDER BY stat_hidden ASC,stat_priority DESC,cat_prio DESC,IFNULL(tk_prio,0) ASC;";
      server.conn.query(sql, [user.accesslevel], function(err, rows){
        if( err ) throw err;
        server.cache.set( req._url.pathname+'-'+user.accesslevel , rows);
        return res.send(rows);
      });
    });
    next();
  });
  
};
