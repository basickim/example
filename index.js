/*
const gtts = require('node-gtts')('en')
var path = require('path')
var filePath = require(__dirname+path);

gtts.save(filePath, "Hello World My name is joonhee", function(){
    console.log("savedone")
})
*/

var gtts = require('node-gtts')('ko');
var path = require('path');
var filepath = path.join(__dirname, 'test.mp3');
 
gtts.save(filepath, '안녕하세요 왜 이 기업에 지원했나요?', function() {
  console.log('save done');
})

