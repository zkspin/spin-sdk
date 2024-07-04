use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fmt;

#[derive(Serialize, Deserialize, Clone)]
pub struct RustGameState {
    pub seed: u64,
    pub score: u64,
    pub mine_positions: HashMap<u64, u64>,
    pub player_position_x: u64,
    pub player_position_y: u64,
}

impl RustGameState {
    pub fn new() -> RustGameState {
        RustGameState {
            seed: 0,
            score: 0,
            mine_positions: HashMap::new(),
            player_position_x: 0,
            player_position_y: 0,
        }
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
