fetch('data.json')
  .then(response => response.json())
  .then(data => {
    let currentQuiz = null;
    let currentLevel = null;
    let currentQuestionIndex = 0;
    let correctAnswers = 0;
    let wrongAnswers = 0;
    let questions = [];

    window.startLevel = function(level) {
      const content = document.getElementById('content');
      content.innerHTML = '';
      document.getElementById('quiz-section').style.display = 'none';

      if (data[level]) {
        data[level].forEach(item => {
          content.innerHTML += `<p class="mb-2">${item.ingilizce} = ${item.turkce}</p>`;
        });
        content.innerHTML += `<button class="btn btn-warning mt-3 w-100" onclick="startQuiz('${level}')">Quiz Başlat</button>`;
      } else {
        content.innerHTML = '<p>Bu seviye için içerik bulunamadı.</p>';
      }
    };

    window.startQuiz = function(level) {
      currentLevel = level || 'kolay'; // Varsayılan seviye olarak "kolay" seçiliyor
      currentQuestionIndex = 0;
      correctAnswers = 0;
      wrongAnswers = 0;
      questions = shuffleArray([...data[currentLevel]]); // Soruları karıştır

      const quizSection = document.getElementById('quiz-section');
      const quizSummary = document.getElementById('quiz-summary');
      quizSection.style.display = 'block';
      quizSummary.style.display = 'none';

      showNextQuestion();
    };

    function showNextQuestion() {
      const quizQuestion = document.getElementById('quiz-question');
      const quizOptions = document.getElementById('quiz-options');
      const quizResult = document.getElementById('quiz-result');
      const quizSummary = document.getElementById('quiz-summary');
      const quizProgress = document.getElementById('quiz-progress');

      quizOptions.innerHTML = '';
      quizResult.innerHTML = '';

      if (currentQuestionIndex >= questions.length) {
        // Tüm sorular bitti, sonuçları göster
        quizProgress.style.display = 'none';
        quizQuestion.style.display = 'none';
        quizOptions.style.display = 'none';
        quizResult.style.display = 'none';
        quizSummary.style.display = 'block';
        document.getElementById('quiz-score').innerHTML = `Quiz Bitti! Doğru: ${correctAnswers}, Yanlış: ${wrongAnswers}`;
        return;
      }

      quizProgress.style.display = 'block';
      quizQuestion.style.display = 'block';
      quizOptions.style.display = 'grid';
      quizResult.style.display = 'block';

      // Soru numarasını göster
      quizProgress.textContent = `Soru ${currentQuestionIndex + 1}/${questions.length}`;

      currentQuiz = questions[currentQuestionIndex].quiz;

      quizQuestion.textContent = currentQuiz.soru;

      // Seçenekleri karıştır
      const shuffledOptions = shuffleArray([...currentQuiz.secenekler]);
      shuffledOptions.forEach(option => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'quiz-option';
        optionDiv.textContent = option;
        optionDiv.onclick = () => checkAnswer(option, currentQuiz.dogru);
        quizOptions.appendChild(optionDiv);
      });
    }

    function checkAnswer(selected, correct) {
      const options = document.querySelectorAll('.quiz-option');
      options.forEach(option => {
        option.onclick = null; // Daha fazla tıklanmayı engelle
        if (option.textContent === correct) {
          option.classList.add('correct');
        } else if (option.textContent === selected) {
          option.classList.add('wrong');
        }
      });

      const quizResult = document.getElementById('quiz-result');
      if (selected === correct) {
        quizResult.textContent = 'Harika! Doğru cevap!';
        quizResult.style.color = '#00e676';
        correctAnswers++;
      } else {
        quizResult.textContent = `Yanlış! Doğru cevap: ${correct}`;
        quizResult.style.color = '#ff3d00';
        wrongAnswers++;
      }

      // 1 saniye bekledikten sonra bir sonraki soruya geç
      setTimeout(() => {
        currentQuestionIndex++;
        showNextQuestion();
      }, 1000);
    }

    // Yeniden başlat fonksiyonunu global bağlama taşı
    window.restartQuiz = function() {
      startQuiz(currentLevel); // Mevcut seviyeyi yeniden başlat
    };

    // Soruları veya seçenekleri karıştırmak için yardımcı fonksiyon
    function shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    }
  })
  .catch(error => {
    console.error('Hata oluştu:', error);
    document.getElementById('content').innerHTML = '<p>Veriler yüklenirken bir hata oluştu.</p>';
  });

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('content').innerHTML = '<p class="text-center">Lütfen bir seviye seçin</p>';
  // Varsayılan olarak bir seviye başlatmak için (örneğin, "kolay" seviye)
  // startLevel('kolay');
});