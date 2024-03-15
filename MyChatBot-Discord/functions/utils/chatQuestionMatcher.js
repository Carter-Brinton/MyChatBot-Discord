class ChatQuestionMatcher {
    constructor(predefinedChatObjects) {
        this.predefinedChatObjects = predefinedChatObjects; // Expecting an object { question: answer }
    }

    findBestMatch(question) {
        // Normalize the input question by removing punctuation and converting to lowercase
        const normalizedQuestion = this.normalizeString(question);

        for (const [predefinedQuestion, answer] of Object.entries(this.predefinedChatObjects)) {
            // Also normalize the predefined questions for a fair comparison
            if (normalizedQuestion === this.normalizeString(predefinedQuestion)) {
                return answer; // Return the answer if a match is found
            }
        }

        return null; // Return null if no exact match is found
    }

    // Function to normalize strings by removing punctuation and converting to lowercase
    normalizeString(str) {
        return str.toLowerCase().replace(/[,.?!'’]/g, '');
    }
}

module.exports = ChatQuestionMatcher;
