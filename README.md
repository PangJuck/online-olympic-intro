# 성화 봉송 인트로

온라인 미니 올림픽 개회용 2D 도트 인트로. 초등학생 남녀 두 명이 성화를 들고 달려와 낮은 성화대에 불을 옮기면, 성화대가 솟아오르고 불이 타오른 뒤 문구가 뜬다. 약 11초.

데모 : https://pangjuck.github.io/online-olympic-intro/

## 이식

파일 하나만 복사하면 된다.

```html
<script src="torch-intro.js"></script>
<script>
  TorchIntro.play({ onDone: function () { /* 원래 입장 처리 */ } });
</script>
```

- 외부 라이브러리 0, 이미지 0, 오디오 파일 0. 캔버스 하나로 그리고 효과음은 WebAudio
- 옵션과 주의사항은 [이식-안내.md](이식-안내.md)
