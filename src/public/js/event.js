
const playBtn = document.getElementById('playBtn');
const stopBtn = document.getElementById("stopBtn");
const sentence = document.getElementById("sentence");

(() => { 
    //const playBtn = document.getElementById("playBtn");
    //const stopBtn = document.getElementById("stopBtn");
    //recBtn.addEventListener("click", recBtnHandler)
    //stopBtn.addEventListener("click", stopBtnHandler);
  })();
  

let speech_sentence = "";

function recBtnHandler() {
  annyang.start({ autoRestart: true, continuous: false });
  const recognition = annyang.getSpeechRecognizer();
  let final_transcript = "";
  recognition.interimResults = true;
  recognition.onresult = function (event) {
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        speech_sentence += event.results[i][0].transcript;
        speech_sentence += " ";
        final_transcript += event.results[i][0].transcript;
        console.log("님이 말하는 문장 : " + final_transcript);
        $('input[name=sentence]').attr('value',speech_sentence);
        //annyang.trigger(final_transcript); //If the sentence is "final" for the Web Speech API, we can try to trigger the sentence
        //const html = `<li>${final_transcript}</li>`;
        final_transcript="";
        //ul.insertAdjacentHTML("beforeend", html);

      } else {
        // interim_transcript += event.results[i][0].transcript;
        // console.log("interim_transcript=" + interim_transcript);
      }
    }
  };

  

}

/* function stopBtnHandler() {
  annyang.abort();
} */
recBtnHandler();
playBtn.addEventListener('click', async () => {      //버튼 눌리면 이벤트리스너 실행
  recBtnHandler();
  
  playBtn.style.display = "none";
  stopBtn.style.display = "block";
});

stopBtn.addEventListener('click', async () => {      //버튼 눌리면 이벤트리스너 실행
  //console.log(speech_sentence);

  playBtn.style.display = "block";
  stopBtn.style.display = "none";

  speech_sentence = "";
});

/* function saveAsFile(str, filename) {
  var hiddenElement = document.createElement('a');
  hiddenElement.href = 'data:attachment/text,' + encodeURI(str);
  hiddenElement.target = '_blank';
  hiddenElement.download = filename;
  hiddenElement.click();
}

var strdata = "Hello, world!";
saveAsFile(strdata, "output.txt"); */