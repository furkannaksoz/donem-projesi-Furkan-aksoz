const sections = [
    {
        title: "Amacımız",
        content: "Simasi, dil öğrenimini eğlenceli ve erişilebilir hale getirerek kullanıcıların Türkçe ve İngilizce becerilerini geliştirmeyi amaçlar. Her seviyeden kullanıcıya hitap eden bir öğrenme deneyimi sunmayı hedefliyoruz."
    },
    {
        title: "Nasıl Çalışır?",
        content: "Simasi, kullanıcıların kelime dağarcığını geliştirmek için kolay, orta ve zor seviyelerde quizler sunar. Kelimeleri öğrenip ardından quizlerle pekiştirirsiniz. Her adımda ilerlemenizi takip edebilir ve yanlışlarınızı gözden geçirebilirsiniz."
    },
    {
        title: "Kazanımlar",
        content: "Simasi ile düzenli pratik yaparak kelime bilginizi artırabilir, dil becerilerinizi geliştirebilir ve özgüvenle iletişim kurabilirsiniz. Eğlenceli bir öğrenme süreciyle kalıcı sonuçlar elde edersiniz."
    },
    {
        title: "İletişim Adresimiz",
        content: "Bizimle iletişime geçmek için e-posta adresimiz: <a href='mailto:furkan.aksoz12@gmail.com' class='text-light'>furkan.aksoz12@gmail.com</a>. Sorularınızı ve önerilerinizi bekliyoruz!"
    }
];

let currentSection = 0;

function nextSection() {
    currentSection = (currentSection + 1) % sections.length; // Döngüsel geçiş
    const titleElement = document.getElementById('about-title');
    const contentElement = document.getElementById('about-content');

    // Animasyonlu geçiş için fade-out ve fade-in efekti
    titleElement.style.opacity = 0;
    contentElement.style.opacity = 0;

    setTimeout(() => {
        titleElement.textContent = sections[currentSection].title;
        contentElement.innerHTML = sections[currentSection].content;
        titleElement.style.opacity = 1;
        contentElement.style.opacity = 1;
    }, 300); // 300ms sonra içeriği güncelle
}