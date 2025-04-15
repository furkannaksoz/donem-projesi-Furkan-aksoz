fetch('data.json')
  .then(response => {
    if (!response.ok) {
      throw new Error('data.json dosyası yüklenemedi: ' + response.statusText);
    }
    return response.json();
  })
  .then(data => {
    let currentQuiz = null;
    let currentLevel = null;
    let currentQuestionIndex = 0;
    let correctAnswers = 0;
    let wrongAnswers = 0;
    let questions = [];
    let userAnswers = [];
    let timerInterval = null;
    let timeLeft = 0;
    let latestQuestionIndex = 0;
    let shuffledOptionsMap = {};
    let totalScore = 0;
    let resultsShown = false;

    window.startLevel = function(level) {
      const content = document.getElementById('content');
      const quizSection = document.getElementById('quiz-section');
      if (!content || !quizSection) {
        console.error('Hata: content veya quiz-section elementi bulunamadı.');
        return;
      }

      content.innerHTML = '';
      quizSection.style.display = 'none';

      if (data[level]) {
        data[level].forEach(item => {
          content.innerHTML += `<p class="mb-2">${item.ingilizce} = ${item.turkce}</p>`;
        });
        content.innerHTML += `
          <div class="d-flex justify-content-between mt-3">
            <button class="btn btn-warning w-30" onclick="startQuiz('${level}')"><i class="bi bi-play-circle-fill me-2"></i><span>Quiz Başlat</span></button>
            <button class="btn btn-secondary w-30" onclick="goBack()"><i class="bi bi-arrow-left-circle-fill me-2"></i><span>Geri</span></button>
          </div>
        `;
      } else {
        content.innerHTML = '<p>Bu seviye için içerik bulunamadı.</p>';
      }
      content.style.display = 'block';
    };

    window.startQuiz = function(level) {
      currentLevel = level;
      currentQuestionIndex = 0;
      latestQuestionIndex = 0;
      correctAnswers = 0;
      wrongAnswers = 0;
      userAnswers = [];
      shuffledOptionsMap = {};
      totalScore = 0;
      timeLeft = 300;
      resultsShown = false;

      if (!data[currentLevel]) {
        console.error(`Hata: ${currentLevel} seviyesi data.json içinde bulunamadı.`);
        document.getElementById('content').innerHTML = '<p>Seviye verisi bulunamadı.</p>';
        return;
      }

      questions = shuffleArray([...data[currentLevel]]);

      questions.forEach((question, index) => {
        if (question.quiz && question.quiz.secenekler) {
          shuffledOptionsMap[index] = shuffleArray([...question.quiz.secenekler]);
        }
      });

      const quizSection = document.getElementById('quiz-section');
      const quizSummary = document.getElementById('quiz-summary');
      const quizResults = document.getElementById('quiz-results');
      const quizTimeout = document.getElementById('quiz-timeout');
      if (!quizSection || !quizSummary || !quizResults || !quizTimeout) {
        console.error('Hata: quiz elementleri bulunamadı.');
        return;
      }

      quizSection.style.display = 'block';
      quizSummary.style.display = 'none';
      quizResults.style.display = 'none';
      quizTimeout.style.display = 'none';
      document.getElementById('content').style.display = 'none';

      startTimer();
      showNextQuestion();
    };

    function startTimer() {
      const timerElement = document.getElementById('timer');
      clearInterval(timerInterval);
      timerInterval = setInterval(() => {
        if (timeLeft > 0) {
          timeLeft--;
          const minutes = Math.floor(timeLeft / 60);
          const seconds = timeLeft % 60;
          timerElement.textContent = `Kalan Süre: ${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
        } else {
          clearInterval(timerInterval);
          showTimeout();
        }
      }, 1000);
    }

    function showTimeout() {
      const quizSection = document.getElementById('quiz-section');
      const quizQuestion = document.getElementById('quiz-question');
      const quizOptions = document.getElementById('quiz-options');
      const quizResult = document.getElementById('quiz-result');
      const quizTimeout = document.getElementById('quiz-timeout');
      quizQuestion.style.display = 'none';
      quizOptions.style.display = 'none';
      quizResult.style.display = 'none';
      quizTimeout.style.display = 'block';
      document.getElementById('quiz-summary').style.display = 'block';
      document.getElementById('quiz-completion-message').textContent = 'Süre doldu, quizi tamamlayamadınız!';
      document.getElementById('quiz-completion-message').style.color = '#e63946';
    }

    function showNextQuestion() {
      const quizQuestion = document.getElementById('quiz-question');
      const quizOptions = document.getElementById('quiz-options');
      const quizResult = document.getElementById('quiz-result');
      const quizSummary = document.getElementById('quiz-summary');
      const quizProgress = document.getElementById('quiz-progress');
      const quizTimeout = document.getElementById('quiz-timeout');
      const nextBtn = document.getElementById('next-btn');
      const completeBtn = document.getElementById('complete-btn');

      if (!quizQuestion || !quizOptions || !quizResult || !quizSummary || !quizProgress || !quizTimeout || !nextBtn || !completeBtn) {
        console.error('Hata: Quiz elementlerinden biri bulunamadı.');
        return;
      }

      quizOptions.innerHTML = '';
      quizResult.innerHTML = '';
      quizTimeout.style.display = 'none';

      if (currentQuestionIndex >= questions.length) {
        clearInterval(timerInterval);
        quizProgress.style.display = 'none';
        quizQuestion.style.display = 'none';
        quizOptions.style.display = 'none';
        quizResult.style.display = 'none';
        quizSummary.style.display = 'block';
        totalScore = correctAnswers * 4;
        quizSummary.innerHTML = `
          <p id="quiz-completion-message" style="color: #00e676;">Tebrikler, quizi tamamladınız!</p>
          <div class="d-flex justify-content-between mt-3">
            <button class="btn btn-success w-30" id="show-results-btn">Sonuçları Göster</button>
            <button class="btn btn-primary w-30" onclick="restartQuiz()"><i class="bi bi-arrow-clockwise me-2"></i><span>Yeniden Başlat</span></button>
            <button class="btn btn-secondary w-30" onclick="goToMainPage()"><i class="bi bi-house-fill me-2"></i><span>Ana Sayfaya Dön</span></button>
          </div>
          <div id="summary-results" style="margin-top: 20px;"></div>
        `;
        completeBtn.disabled = true;
        nextBtn.style.display = 'inline-block';
        nextBtn.disabled = true;

        // Sonuçları Göster butonuna tıklama işlevi ekle
        document.getElementById('show-results-btn').onclick = function() {
          const summaryResults = document.getElementById('summary-results');
          summaryResults.innerHTML = `
            <h3>Puan: ${totalScore}/${questions.length * 4}</h3>
            <div style="max-height: 300px; overflow-y: auto;">
              ${userAnswers.map((answer, index) => `
                <div class="mb-3 p-3" style="background: ${answer.dogruMu ? 'rgba(0, 230, 118, 0.1)' : 'rgba(255, 61, 0, 0.1)'}; border-radius: 10px;">
                  <p><strong>Soru ${index + 1}: ${answer.soru}</strong></p>
                  <p>Seçtiğiniz cevap: ${answer.secilen}</p>
                  <p>Doğru cevap: ${answer.dogru}</p>
                  <p>${answer.dogruMu ? 'Doğru!' : 'Yanlış!'}</p>
                </div>
              `).join('')}
            </div>
          `;
        };
        return;
      }

      quizProgress.style.display = 'block';
      quizQuestion.style.display = 'block';
      quizOptions.style.display = 'grid';
      quizResult.style.display = 'block';
      nextBtn.style.display = 'inline-block';

      quizProgress.textContent = `Soru ${currentQuestionIndex + 1}/${questions.length}`;

      if (currentQuestionIndex === questions.length - 1) {
        nextBtn.innerHTML = '<i class="bi bi-check-circle-fill me-2"></i><span>Quizi Bitir ve Sonuçları Göster</span>';
        nextBtn.classList.remove('btn-secondary');
        nextBtn.classList.add('btn-success');
        nextBtn.onclick = showResults;
        nextBtn.disabled = !userAnswers[currentQuestionIndex];
        completeBtn.disabled = !userAnswers[currentQuestionIndex];
      } else {
        nextBtn.innerHTML = '<i class="bi bi-arrow-right-circle-fill me-2"></i><span>Sonraki Soru</span>';
        nextBtn.classList.remove('btn-success');
        nextBtn.classList.add('btn-secondary');
        nextBtn.onclick = nextQuestion;
        nextBtn.disabled = !userAnswers[currentQuestionIndex];
        completeBtn.disabled = true;
      }

      currentQuiz = questions[currentQuestionIndex].quiz;

      if (!currentQuiz || !currentQuiz.soru || !currentQuiz.secenekler || !currentQuiz.dogru) {
        console.error(`Hata: ${currentQuestionIndex}. sorunun quiz verisi eksik veya hatalı:`, questions[currentQuestionIndex]);
        quizQuestion.textContent = 'Soru yüklenemedi.';
        return;
      }

      quizQuestion.textContent = currentQuiz.soru;

      const shuffledOptions = shuffledOptionsMap[currentQuestionIndex];
      const optionLabels = ['A', 'B', 'C', 'D'];
      shuffledOptions.forEach((option, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'quiz-option';
        optionDiv.textContent = `${optionLabels[index]}. ${option}`;
        if (!userAnswers[currentQuestionIndex] && !resultsShown) {
          optionDiv.onclick = () => checkAnswer(option, currentQuiz.dogru);
        }
        quizOptions.appendChild(optionDiv);
      });

      if (userAnswers[currentQuestionIndex]) {
        const selected = userAnswers[currentQuestionIndex].secilen;
        const correct = userAnswers[currentQuestionIndex].dogru;
        quizOptions.querySelectorAll('.quiz-option').forEach(option => {
          if (option.textContent.slice(3) === correct) {
            option.classList.add('correct');
          } else if (option.textContent.slice(3) === selected) {
            option.classList.add('wrong');
          }
        });
        quizResult.textContent = selected === correct ? 'Harika! Doğru cevap!' : `Yanlış! Doğru cevap: ${correct}`;
        quizResult.style.color = selected === correct ? '#00e676' : '#ff3d00';
      }
    }

    function checkAnswer(selected, correct) {
      const options = document.querySelectorAll('.quiz-option');
      const quizResult = document.getElementById('quiz-result');
      const nextBtn = document.getElementById('next-btn');
      const completeBtn = document.getElementById('complete-btn');

      if (!quizResult || !nextBtn || !completeBtn) {
        console.error('Hata: quiz-result, next-btn veya complete-btn elementi bulunamadı.');
        return;
      }

      options.forEach(option => {
        option.onclick = null;
        if (option.textContent.slice(3) === correct) {
          option.classList.add('correct');
        } else if (option.textContent.slice(3) === selected) {
          option.classList.add('wrong');
        }
      });

      userAnswers[currentQuestionIndex] = {
        soru: currentQuiz.soru,
        secilen: selected,
        dogru: correct,
        dogruMu: selected === correct
      };

      if (selected === correct) {
        quizResult.textContent = 'Harika! Doğru cevap!';
        quizResult.style.color = '#00e676';
        correctAnswers++;
      } else {
        quizResult.textContent = `Yanlış! Doğru cevap: ${correct}`;
        quizResult.style.color = '#ff3d00';
        wrongAnswers++;
      }

      latestQuestionIndex = Math.max(latestQuestionIndex, currentQuestionIndex + 1);

      if (currentQuestionIndex === questions.length - 1) {
        nextBtn.disabled = false;
        completeBtn.disabled = false;
      } else {
        setTimeout(() => {
          currentQuestionIndex++;
          showNextQuestion();
        }, 1000);
      }
    }

    window.previousQuestion = function() {
      if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        showNextQuestion();
      }
    };

    window.nextQuestion = function() {
      const quizResult = document.getElementById('quiz-result');
      if (!userAnswers[currentQuestionIndex]) {
        quizResult.textContent = 'Bu soruyu çözmen gerek!';
        quizResult.style.color = '#e63946';
      } else if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        showNextQuestion();
      }
    };

    window.completeQuiz = function() {
      const completeBtn = document.getElementById('complete-btn');
      if (currentQuestionIndex === questions.length - 1 && userAnswers[currentQuestionIndex]) {
        currentQuestionIndex++;
        showNextQuestion();
        completeBtn.disabled = true;
      }
    };

    window.restartQuiz = function() {
      startQuiz(currentLevel);
    };

    window.goBack = function() {
      const content = document.getElementById('content');
      const quizSection = document.getElementById('quiz-section');
      if (!content || !quizSection) {
        console.error('Hata: content veya quiz-section elementi bulunamadı.');
        return;
      }

      content.style.display = 'block';
      quizSection.style.display = 'none';
      content.innerHTML = `
        <div class="row justify-content-center">
          <div class="col-md-4 mb-3">
            <button class="btn btn-primary w-100 level-btn" onclick="startLevel('kolay')"><i class="bi bi-star-fill me-2"></i><span>Kolay Seviye</span></button>
          </div>
          <div class="col-md-4 mb-3">
            <button class="btn btn-primary w-100 level-btn" onclick="startLevel('orta')"><i class="bi bi-star-fill me-2"></i><span>Orta Seviye</span></button>
          </div>
          <div class="col-md-4 mb-3">
            <button class="btn btn-primary w-100 level-btn" onclick="startLevel('zor')"><i class="bi bi-star-fill me-2"></i><span>Zor Seviye</span></button>
          </div>
        </div>
      `;
    };

    window.goBackFromQuiz = function() {
      clearInterval(timerInterval);
      const content = document.getElementById('content');
      const quizSection = document.getElementById('quiz-section');
      if (!content || !quizSection) {
        console.error('Hata: content veya quiz-section elementi bulunamadı.');
        return;
      }

      quizSection.style.display = 'none';
      content.style.display = 'block';
      startLevel(currentLevel);
    };

    window.goToMainPage = function() {
      clearInterval(timerInterval);
      const content = document.getElementById('content');
      const quizSection = document.getElementById('quiz-section');
      const quizResults = document.getElementById('quiz-results');
      const quizSummary = document.getElementById('quiz-summary');
      if (!content || !quizSection || !quizResults || !quizSummary) {
        console.error('Hata: content, quiz-section, quiz-results veya quiz-summary elementi bulunamadı.');
        return;
      }

      quizSection.style.display = 'none';
      quizResults.style.display = 'none';
      quizSummary.style.display = 'none';
      content.style.display = 'block';
      content.innerHTML = `
        <div class="row justify-content-center">
          <div class="col-md-4 mb-3">
            <button class="btn btn-primary w-100 level-btn" onclick="startLevel('kolay')"><i class="bi bi-star-fill me-2"></i><span>Kolay Seviye</span></button>
          </div>
          <div class="col-md-4 mb-3">
            <button class="btn btn-primary w-100 level-btn" onclick="startLevel('orta')"><i class="bi bi-star-fill me-2"></i><span>Orta Seviye</span></button>
          </div>
          <div class="col-md-4 mb-3">
            <button class="btn btn-primary w-100 level-btn" onclick="startLevel('zor')"><i class="bi bi-star-fill me-2"></i><span>Zor Seviye</span></button>
          </div>
        </div>
      `;
    };

    window.showResults = function() {
      const quizQuestion = document.getElementById('quiz-question');
      const quizOptions = document.getElementById('quiz-options');
      const quizResult = document.getElementById('quiz-result');
      const quizProgress = document.getElementById('quiz-progress');
      const nextBtn = document.getElementById('next-btn');
      const completeBtn = document.getElementById('complete-btn');

      if (!quizQuestion || !quizOptions || !quizResult || !quizProgress || !nextBtn || !completeBtn) {
        console.error('Hata: quiz elementlerinden biri bulunamadı.');
        return;
      }

      quizQuestion.style.display = 'none';
      quizOptions.style.display = 'none';
      quizProgress.style.display = 'none';
      nextBtn.style.display = 'inline-block';
      nextBtn.disabled = true;
      resultsShown = true;

      totalScore = correctAnswers * 4;

      quizResult.innerHTML = `
        <h3>Puan: ${totalScore}/${questions.length * 4}</h3>
        <div id="results-list" style="max-height: 300px; overflow-y: auto;">
          ${userAnswers.map((answer, index) => `
            <div class="mb-3 p-3" style="background: ${answer.dogruMu ? 'rgba(0, 230, 118, 0.1)' : 'rgba(255, 61, 0, 0.1)'}; border-radius: 10px;">
              <p><strong>Soru ${index + 1}: ${answer.soru}</strong></p>
              <p>Seçtiğiniz cevap: ${answer.secilen}</p>
              <p>Doğru cevap: ${answer.dogru}</p>
              <p>${answer.dogruMu ? 'Doğru!' : 'Yanlış!'}</p>
            </div>
          `).join('')}
        </div>
      `;
      quizResult.style.color = '#000';
    };

    window.goBackToQuiz = function() {
      const quizResults = document.getElementById('quiz-results');
      const quizSection = document.getElementById('quiz-section');
      const completeBtn = document.getElementById('complete-btn');
      if (!quizResults || !quizSection || !completeBtn) {
        console.error('Hata: quiz-results, quiz-section veya complete-btn elementi bulunamadı.');
        return;
      }

      quizResults.style.display = 'none';
      quizSection.style.display = 'block';
      if (currentQuestionIndex < questions.length - 1) {
        completeBtn.disabled = true;
      } else if (userAnswers[currentQuestionIndex]) {
        completeBtn.disabled = false;
      }
      showNextQuestion();
    };

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
    const content = document.getElementById('content');
    if (content) {
      content.innerHTML = '<p>Veriler yüklenirken bir hata oluştu: ' + error.message + '</p>';
    }
  });

document.addEventListener('DOMContentLoaded', () => {
  const content = document.getElementById('content');
  if (content) {
    content.innerHTML = `
      <div class="row justify-content-center">
        <div class="col-md-4 mb-3">
          <button class="btn btn-primary w-100 level-btn" onclick="startLevel('kolay')"><i class="bi bi-star-fill me-2"></i><span>Kolay Seviye</span></button>
        </div>
        <div class="col-md-4 mb-3">
          <button class="btn btn-primary w-100 level-btn" onclick="startLevel('orta')"><i class="bi bi-star-fill me-2"></i><span>Orta Seviye</span></button>
        </div>
        <div class="col-md-4 mb-3">
          <button class="btn btn-primary w-100 level-btn" onclick="startLevel('zor')"><i class="bi bi-star-fill me-2"></i><span>Zor Seviye</span></button>
        </div>
      </div>
    `;
  }
});