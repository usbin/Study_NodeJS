var http = require('http');
var fs = require('fs');
var url = require('url');
var qs = require('querystring');
var template = require('./lib/template.js');
var path = require('path');
var sanitizeHtml = require('sanitize-html');

var app = http.createServer(function(request,response){
    var _url = request.url;
    var queryData = url.parse(_url, true).query;
    var pathname = url.parse(_url, true).pathname;
    if(pathname === '/'){
      if(queryData.id === undefined){
        fs.readdir('./data', function(error, filelist){
          var title = 'Welcome';
          var description = 'Hello, Node.js!';
          var list = template.list(filelist);
          var html = template.HTML(title, `<h2>${title}</h2>
            <p>${description}</p>`, list, `<a href="/create">create</a>`);
          response.writeHead(200);
          response.end(html);
        })
        
      }
      else{
        var filteredId = path.parse(queryData.id).base;
        fs.readFile(`data/${filteredId}`, 'utf8', function(err, description){
          fs.readdir('./data', function(error, filelist){
            var title = queryData.id;
            var sanitizedTitle = sanitizeHtml(title);
            var sanitizedDescription = sanitizeHtml(description,
              {allowedTag: ['h1']});
            var list = template.list(filelist);
            var html= template.HTML(sanitizedTitle, 
              `<h2>${sanitizedTitle}</h2> <p>${sanitizedDescription}</p>`, 
              list, 
              `<a href="/create">create</a>
              <a href="/update?id=${sanitizedTitle}">update</a>
              <form action="delete_process" method="post">
                <input type="hidden" name="id" value="${sanitizedTitle}">
                <input type="submit" value="delete">
              </form>`
            );
            response.writeHead(200);
            response.end(html);
          });
        });
      }
    }
    else if(pathname === '/create'){
      fs.readdir('./data', function(error, filelist){
        var title = queryData.id;
        var list = template.list(filelist);
        var html = template.HTML(title, `
          <form action="/create_process" method="post">
          <p>
            <input type="text" name="title" placeholder="title">
          </p>
          <p>
            <textarea name="description" placeholder="description"></textarea>
          </p>
          <p>
            <input type="submit">
          </p>
          </form>
          `, list, '');
        response.writeHead(200);
        response.end(html);
      });
    }
    else if(pathname === '/create_process'){
      //데이터가 여러 번에 나뉘어 오다가 더이상 올 게 없으면 end가 실행됨.
      var body = '';
      request.on('data', function(data){
        body = body + data;
      })
      request.on('end', function(){
        var post = qs.parse(body);
        var title = post.title;
        var description = post.description;
        fs.writeFile(`data/${title}`, description, 'utf8', function(error){
          //리다이렉션
          response.writeHead(302, {Location: `/?id=${title}`});
          response.end();
        });
      });
      
    }
    else if(pathname === '/update'){
      
      var filteredId = path.parse(queryData.id).base;
      fs.readFile(`data/${filteredId}`, 'utf8', function(err, description){
        fs.readdir('./data', function(error, filelist){
          var title = queryData.id;
          var list = template.list(filelist);
          var html = template.HTML(title, `
            <form action="/update_process" method="post">
            <p>
              <input type="hidden" name="id" value=${title}>
              <input type="text" name="title" placeholder="title" value=${title}>
            </p>
            <p>
              <textarea name="description" placeholder="description">${description}</textarea>
            </p>
            <p>
              <input type="submit">
            </p>
            </form>
            `, list, '');
          response.writeHead(200);
          response.end(html);
        });
      });
    }
    else if(pathname === '/update_process'){
      //데이터가 여러 번에 나뉘어 오다가 더이상 올 게 없으면 end가 실행됨.
      var body = '';
      request.on('data', function(data){
        body = body + data;
      })
      request.on('end', function(){
        var post = qs.parse(body);
        var id = post.id;
        var title = post.title;
        var description = post.description;
        var filteredId = path.parse(id).base;
        fs.rename(`data/${filteredId}`, `data/${title}`, function(error){
          fs.writeFile(`data/${title}`, description, 'utf8', function(error){
          //리다이렉션
          response.writeHead(302, {Location: `/?id=${filteredId}`});
          response.end();
          });
        });
      
      });
    }
    else if(pathname === '/delete_process'){
      //데이터가 여러 번에 나뉘어 오다가 더이상 올 게 없으면 end가 실행됨.
      var body = '';
      request.on('data', function(data){
        body = body + data;
      })
      request.on('end', function(){
        var post = qs.parse(body);
        var id = post.id;
        var filteredId = path.parse(id).base;
        fs.unlink(`data/${filteredId}`, function(error){
          response.writeHead(302, {Location: `/`});
          response.end();
        });
      });
      
    }
  
   
    else {
      response.writeHead(404);
      response.end('Not found');
    }
});
app.listen(3000);
