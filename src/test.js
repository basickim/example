const fs = require('fs')

const tenu = {"1":"dsadas"};

fs.readFile('../test.txt', 'utf8' , (err, data) => {
    if (err) {
      console.error(err)
      return
    }
    const input = JSON.parse(data);     //jsstring으로 변환
    //console.log(sentence);
    console.log(input.sentence);
  })