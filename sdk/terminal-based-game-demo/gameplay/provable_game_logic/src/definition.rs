use serde::{Deserialize, Serialize};
use std::fmt;

#[derive(Serialize, Deserialize, Clone)]
pub struct RustGameState {
    pub seed: u64,
    pub score: u64,
}

impl RustGameState {
    pub fn new() -> RustGameState {
        RustGameState { seed: 0, score: 0 }
    }
}

impl fmt::Display for RustGameState {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(
            f,
            "RustGameState {{ seed: {}, score: {} }}",
            self.seed, self.score
        )
    }
}
