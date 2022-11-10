(() => {
    const recBtn = document.getElementById("playBtn");
    const stopBtn = document.getElementById("stopBtn");
    recBtn.addEventListener("click", recBtnHandler);
    //stopBtn.addEventListener("click", stopBtnHandler);
  })();
  
  const ul = document.getElementById("sttResult");
  
  function recBtnHandler() {
    annyang.start({ autoRestart: true, continuous: false });
    const recognition = annyang.getSpeechRecognizer();
    let final_transcript = "";
    recognition.interimResults = true;
    recognition.onresult = function (event) {
      //console.log(event);
      // let interim_transcript = "";
      // final_transcript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final_transcript += event.results[i][0].transcript;
          console.log("님이 말하는 문장 : " + final_transcript);
          //annyang.trigger(final_transcript); //If the sentence is "final" for the Web Speech API, we can try to trigger the sentence
          //const html = `<li>${final_transcript}</li>`;
          final_transcript="";
  
          //ul.insertAdjacentHTML("beforeend", html);
        } else {
          // interim_transcript += event.results[i][0].transcript;
          // console.log("interim_transcript=" + interim_transcript);
        }
      }
      // console.log("중간값: " + interim_transcript);
      // console.log("결과값: " + final_transcript);
    };
  }
  
  function stopBtnHandler() {
    annyang.abort();
  }