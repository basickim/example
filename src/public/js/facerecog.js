const video = document.getElementById('video');
const ai = document.getElementById('ai');
const playBtn = document.getElementById('playBtn');
const message = document.getElementById('message');
const message2 = document.getElementById('message2');
/*
const $body = $('body');
const $message = $('message');
const $sentiment = $('sentiment');
const $ai_talk = $('ai_talk');      //어케할까
const $neutral = $('neutral');
const $happy = $('happy');
const $sad = $('sad');
const $surprised = $('surprised');
const $ai = $('ai');
*/

const fadeout_duration = 300;
const opacity_init = 0.1;
const opacity_step = 0.1;
const same_expression_skip = 10;
const ai_feedback_expression = {        //인공지능이 말하는 듯한 메세지
    neutral : ["표정이 경직되어 있어요!","조금만 긴장을 푸세요"],
    happy: ["잘하고 있어요!","조금만 더 웃어봐요"],
    surprised : ["놀라지마세요"],
    sad : ["표정이 경직되어 있어요!"],
};
const setting_feedback = {
    setting : ["환경을 체크합니다. 화면에 얼굴이 제대로 인식되는지 확인해주세요", "화면 안으로 들어와주세요", "면접 시작"]
}
const timeout = 800;       //렌더링 타임아웃

let state = 0;
let hide = false;
let inputSize = 224;
let scoreThreshold = 0.5;
let opacity = 0.1;

let same_expression_count = 0;      //이거로 통과 실패 가리면 될듯
let before_expression = "neutral";

var time = 60;

//모델 로드
Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
    faceapi.nets.faceExpressionNet.loadFromUri('/models')
]).then(startVideo);


//비디오 시작함수
function startVideo() {
    navigator.getUserMedia(
        { video: {} },
        stream => video.srcObject = stream,
        err => console.error(err)
    )
}

//현재 최고 수치 감정 가져오기
function get_top_expression(obj){  
    let default_value = 0;
    let final_expression;
    let ret_obj
    _.mapObject(obj, (v,k) => {
        if(default_value < v){
            default_value = v;
            final_expression = k;
            ret_obj = {default_value, final_expression}
        }
    });
    return ret_obj;
}

//대화상자 출력함수
function ai_talk(obj){
    let value = obj["default_value"];
    let expression = obj["final_expression"];
    //ai.innerHTML = '출력'; 

    //reset();
        
    if(expression == 'happy'){
        if(value > 0.6){
            ai.innerHTML = ai_feedback_expression['happy']['0']; ; 
        }
        else if(value <= 0.6 && value > 0.3){
            ai.innerHTML = ai_feedback_expression['happy']['1']; 
        }
    }
    else if(expression == 'neutral'){
        if(value > 0.6){
            ai.innerHTML = ai_feedback_expression['neutral']['0']; 
        }
        else if(value <= 0.6 && value > 0.3){
            ai.innerHTML = ai_feedback_expression['neutral']['1']; 
        }
    }
    else if(expression == 'sad'){
        if(value > 0.6){
            ai.innerHTML = ai_feedback_expression['sad']['0']; 
        }
    }
    else if(expression == 'surprised'){
        ai.innerHTML = ai_feedback_expression['happy']['1']; 
    }
    else if(expression == 'angry'){
        ai.innerHTML = ai_feedback_expression['happy']['1']; 
    }
    else{
        ai.innerHTML = "화면 안으로 들어와주세요"; 
    }
    /*
    if(before_expression != expression){
        reset();
        if(expression == 'neutral'){
            $(".neutral").css('z-index', 1);
            $(".happy").css('z-index', 1);
            $(".surprised").css('z-index', 1);
            $(".sad").css('z-index', 1);
        }
        else if(expression == 'happy'){
            $(".neutral").css('z-index', 1);
            $(".happy").css('z-index', 1);
            $(".surprised").css('z-index', 1);
            $(".sad").css('z-index', 1);
        }
        else if(expression == 'surprised'){
            $(".neutral").css('z-index', 1);
            $(".happy").css('z-index', 1);
            $(".surprised").css('z-index', 1);
            $(".sad").css('z-index', 1);
        }
        else if(expression == 'sad'){
            $(".neutral").css('z-index', 1);
            $(".happy").css('z-index', 1);
            $(".surprised").css('z-index', 1);
            $(".sad").css('z-index', 1);
        }
    }*/
}
 
//faceapi 타이니디텍터 옵션 가져오기
function getFaceDetectorOptions(){
    return new faceapi.TinyFaceDetectorOptions({inputSize, scoreThreshold})
}

//시작함수
async function onPlay(){
    const videoEl = $('video').get(0);      //비디오 가져오기(제이쿼리사용)
    if(videoEl.paused || videoEl.ended){    //비디오 멈추거나 끝나면
        return;
    }
    const options = getFaceDetectorOptions();
    const detections = await faceapi.detectSingleFace(videoEl, options).withFaceLandmarks().withFaceExpressions();
    const canvas = $('#overlayCanvas').get(0);


    if(detections){ //제대로 가져왔으면
        const dims = faceapi.matchDimensions(canvas, videoEl, true);
        const resizedResult = faceapi.resizeResults(detections, dims);
        const minConfidence = 0.05;     //주어진 수치 사용한다?
        try{    //트라이 성공
            if(state == 1){
                message.innerHTML = setting_feedback['setting']['2']
                const expression = get_top_expression(resizedResult.expressions);    //여러 감정 중 가장 높은 수치의 감정을 가져옴
                //console.log(expression);
                ai_talk(expression);      //추가 구현 과제
            }
            else if(state == 2){
                message.innerHTML = "면접 질문 중";
                message2.innerHTML = "";
                ai.innerHTML = "";
                
            }
            else{
                message.innerHTML = setting_feedback['setting']['0'];
                message2.innerHTML = "인식 성공";
                ai.innerHTML = "";
                faceapi.draw.drawDetections(canvas, resizedResult);
                faceapi.draw.drawFaceLandmarks(canvas, resizedResult);
                faceapi.draw.drawFaceExpressions(canvas, resizedResult, minConfidence);
            } 
        }catch(e){
            //console.error(e.message);
        }
     
    }else{
        if(state == 0)message2.innerHTML = "화면 안으로 들어와주세요";
        //else 
        else if(state == 1) ai.innerHTML = "화면 안으로 들어와주세요"; 
    }
}

video.addEventListener('play', async () => {      //비디오 켜지면 이벤트리스너 실행
    setInterval(async () => {
        onPlay();
    }, timeout)
});

// 이벤트 영역
const selectLang = "ko-KR"
const text = "이 기업에 왜 지원했나요?"

function speak(text, opt_prop) {
    if (typeof SpeechSynthesisUtterance === "undefined" || typeof window.speechSynthesis === "undefined") {
        alert("이 브라우저는 음성 합성을 지원하지 않습니다.")
        return
    }
    
    window.speechSynthesis.cancel() // 현재 읽고있다면 초기화

    const prop = opt_prop || {}

    const speechMsg = new SpeechSynthesisUtterance()
    speechMsg.rate = prop.rate || 0.2 // 속도: 0.1 ~ 10      
    speechMsg.pitch = prop.pitch || 1 // 음높이: 0 ~ 2
    speechMsg.lang = prop.lang || "ko-KR"
    speechMsg.text = text
    
    // SpeechSynthesisUtterance에 저장된 내용을 바탕으로 음성합성 실행
    window.speechSynthesis.speak(speechMsg)

    state = 1;  //진행상황 시작
    message2.innerHTML = "";
}


playBtn.addEventListener('click', () => {      //버튼 눌리면 이벤트리스너 실행
    state = 2;      //질문상황 시작
    
    speak(text, {
        rate: 1,
        pitch: 0.8,
        lang: selectLang
    })

    //var audio = new Audio('/speech/test.mp3');
     //audio.play();
     
    
    /* speak.addEventListener("ended", function(){ 
        state = 1;  //진행상황 시작
        message2.innerHTML = "";
    });  */  
});






/*
var gtts = require('node-gtts')('en');
var path = require('path');
var filepath = path.join(__dirname, 'i-love-you.wav');
 
gtts.save(filepath, 'I love you', function() {
  console.log('save done');
})*/

/*
let gtts = require('node-gtts')('en')     //이게 문젠데 왜 안되는지 모르겟음 경로문제같은데
var path = require('path')
var filePath = path.join(__dirnamem, 'test.mp3');

gtts.save(filePath, "Hello World My name is joonhee", function(){
    console.log("savedone")
})*/
