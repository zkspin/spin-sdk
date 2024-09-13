pub const STATE_SIZE: usize = 2;

/**
 * Clone: For deep copy
 * Default: For default initialization
 */
#[derive(Clone, Default)]
pub struct SpinGameStates {
    // define your game state here in order, all data types needs to be u64
    pub total_steps: u64,
    pub current_position: u64,
}
