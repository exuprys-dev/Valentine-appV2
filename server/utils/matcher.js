function calculateSimilarity(hobbies1, hobbies2) {
    if (!hobbies1 || !hobbies2) return 0;
    const set1 = new Set(hobbies1.map(h => h.toLowerCase().trim()));
    const set2 = new Set(hobbies2.map(h => h.toLowerCase().trim()));

    let intersection = 0;
    for (const hobby of set1) {
        if (set2.has(hobby)) intersection++;
    }

    const union = new Set([...set1, ...set2]).size;
    return union === 0 ? 0 : intersection / union;
}

module.exports = { calculateSimilarity };
