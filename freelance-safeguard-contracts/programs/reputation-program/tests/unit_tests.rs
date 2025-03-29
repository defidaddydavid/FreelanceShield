use anchor_lang::prelude::*;
use reputation_program::*;

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_calculate_reputation_score() {
        // Test with no contracts completed
        let score = calculate_reputation_score(0, 0, 0, 0, 0, 0);
        assert_eq!(score, 70); // Should return default initial score
        
        // Test with high success rate
        let score = calculate_reputation_score(10, 9, 0, 0, 0, 0);
        assert!(score > 70); // Score should increase with high success rate
        
        // Test with high dispute rate
        let score = calculate_reputation_score(10, 2, 8, 0, 0, 0);
        assert!(score < 70); // Score should decrease with high dispute rate
        
        // Test with mixed history
        let score = calculate_reputation_score(10, 7, 2, 3, 2, 1);
        assert!(score >= 50 && score <= 90); // Score should be in reasonable range
    }
    
    #[test]
    fn test_calculate_reputation_factor() {
        // Test minimum score
        let factor = calculate_reputation_factor(0);
        assert_eq!(factor, 70); // Minimum factor
        
        // Test maximum score
        let factor = calculate_reputation_factor(100);
        assert_eq!(factor, 100); // Maximum factor
        
        // Test middle score
        let factor = calculate_reputation_factor(50);
        assert_eq!(factor, 85); // (70 + (50 * 30 / 100)) = 85
    }
}

