// Function to generate questions based on content
document.getElementById('generateQuestionsBtn').addEventListener('click', function() {
    generateQuestions(false); // Generate new questions and clear previous ones
});

// Function to generate more questions without clearing previous ones
document.getElementById('generateMoreQuestionsBtn').addEventListener('click', function() {
    generateQuestions(true); // Generate more questions and append them
});

// Function to handle generating questions
function generateQuestions(append) {
    let content = document.getElementById('contentInput').value;
    let questionsContainer = document.getElementById('questionsContainer');
    
    if (!append) {
        questionsContainer.innerHTML = ''; // Clear previous questions if not appending
    }

    if (content.trim() === '') {
        alert('Please enter some content to generate questions.');
        return;
    }

    fetch('/generate-question', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: content }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.question) {
            // Create a new div for the question and answer input
            let questionDiv = document.createElement('div');
            questionDiv.classList.add('question');
            questionDiv.innerHTML = `
                <p><strong>Generated Question:</strong> ${data.question}</p>
                <input type="text" placeholder="Enter your answer here" class="answerInput">
            `;
            questionsContainer.appendChild(questionDiv);

            // Show action buttons after the first question is generated
            document.getElementById('actionButtons').style.display = 'block';
        } else {
            alert('Error generating question: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// Function to generate flashcards based on content
document.getElementById('generateFlashcardsBtn').addEventListener('click', function() {
    let content = document.getElementById('contentInput').value;
    let flashcardsContainer = document.getElementById('flashcardsContainer');
    flashcardsContainer.innerHTML = ''; // Clear previous flashcards

    if (content.trim() === '') {
        alert('Please enter some content to generate flashcards.');
        return;
    }

    fetch('/generate-flashcards', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: content }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.flashcards) {
            data.flashcards.forEach((flashcard, index) => {
                let flashcardDiv = document.createElement('div');
                flashcardDiv.classList.add('flashcard');
                flashcardDiv.innerHTML = `
                    <p><strong>Flashcard ${index + 1}:</strong></p>
                    <p>${flashcard}</p>
                `;
                flashcardsContainer.appendChild(flashcardDiv);
            });
        } else {
            alert('Error generating flashcards: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
});

// Function to check answers based on the generated question
document.getElementById('checkAnswersBtn').addEventListener('click', function() {
    let answerInputs = document.querySelectorAll('.answerInput');
    let content = document.getElementById('contentInput').value;
    let resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = ''; // Clear previous results

    answerInputs.forEach(input => {
        let answer = input.value;
        let question = input.previousElementSibling.textContent.replace('Generated Question: ', '');

        if (answer.trim() === '') {
            alert('Please enter an answer.');
            return;
        }

        fetch('/check-answer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ answer: answer, content: content, question: question }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.result) {
                let resultItem = document.createElement('p');
                resultItem.innerHTML = `<strong>Result for "${question}":</strong> ${data.result}`;
                resultsDiv.appendChild(resultItem);
            } else {
                alert('Error checking answer: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    });
});

// Function to handle closing the Q&A window and resetting the state
document.getElementById('closeBtn').addEventListener('click', function() {
    let questionsContainer = document.getElementById('questionsContainer');
    let flashcardsContainer = document.getElementById('flashcardsContainer');
    let resultsContainer = document.getElementById('results');

    // Clear content, results, and reset state
    questionsContainer.innerHTML = '';
    flashcardsContainer.innerHTML = '';
    resultsContainer.innerHTML = '';
    document.getElementById('contentInput').value = '';
    document.getElementById('actionButtons').style.display = 'none'; // Hide action buttons
});
