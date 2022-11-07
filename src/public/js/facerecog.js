
const video = document.getElementById('video');
const ai = document.getElementById('ai');
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
    sad : ["표정이 경직되어 있어요!"]
};
const timeout = 500;       //렌더링 타임아웃


let hide = false;
let inputSize = 224;
let scoreThreshold = 0.5;
let opacity = 0.1;

let same_expression_count = 0;      //이거로 통과 실패 가리면 될듯
let before_expression = "neutral";

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
    console.log(value, expression);
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
        else if(value <= 0.6 && value > 0.3){
            ai.innerHTML = ai_feedback_expression['sad']['1']; 
        }
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
            const expression = get_top_expression(resizedResult.expressions);    //여러 감정 중 가장 높은 수치의 감정을 가져옴
            //console.log(expression);
            ai_talk(expression);      //추가 구현 과제
        }catch(e){
            console.error(e.message);
        }

        faceapi.draw.drawDetections(canvas, resizedResult);
        faceapi.draw.drawFaceLandmarks(canvas, resizedResult);
        faceapi.draw.drawFaceExpressions(canvas, resizedResult, minConfidence);

        
    }else{

    }
}

video.addEventListener('play', async () => {      //비디오 켜지면 이벤트리스너 실행

    setInterval(async () => {
      onPlay();
    }, timeout)

});

