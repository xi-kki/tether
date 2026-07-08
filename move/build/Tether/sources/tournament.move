/// Tether — Flash Tournament System
///
/// 60-second elimination tournaments on Sui.
/// Players pay a small entry fee, compete in real-time,
/// and the smart contract distributes prizes instantly.

module tether::tournament {
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::object::{Self, UID, ID};
    use sui::sui::SUI;
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::event;

    const EWrongPhase: u64 = 1;
    const ETournamentFull: u64 = 2;
    const EInsufficientFee: u64 = 3;
    const ENotEnded: u64 = 5;
    const EAlreadySubmitted: u64 = 6;
    const ENoPrize: u64 = 7;

    const MAX_PLAYERS: u64 = 64;
    const DURATION_SECS: u64 = 60;
    const TOP_PLAYERS: u64 = 3;

    /// A Flash Tournament — shared object
    public struct Tournament has key {
        id: UID,
        creator: address,
        entry_fee: u64,
        max_players: u64,
        phase: u8,           // 0=registration, 1=running, 2=ended
        start_time: u64,
        duration_ms: u64,
        prize_pool: Balance<SUI>,
        player_count: u64,
        top_scores: vector<PlayerScore>,
        seed_hash: u256,
    }

    public struct PlayerScore has store, copy, drop {
        player: address,
        score: u64,
        grazing_count: u64,
        average_angle_error: u64,
        timestamp_ms: u64,
    }

    public struct PlayerEntry has key {
        id: UID,
        player: address,
        tournament_id: ID,
        score_submitted: bool,
        final_score: u64,
        prize_claimed: bool,
    }

    public struct TournamentCreated has copy, drop {
        tournament_id: ID,
        creator: address,
        entry_fee: u64,
        max_players: u64,
        seed_hash: u256,
    }

    public struct PlayerJoined has copy, drop {
        tournament_id: ID,
        player: address,
        total_players: u64,
    }

    public struct ScoreSubmitted has copy, drop {
        tournament_id: ID,
        player: address,
        score: u64,
        rank: u64,
    }

    public struct PrizeAwarded has copy, drop {
        tournament_id: ID,
        player: address,
        amount: u64,
        rank: u64,
    }

    /// Create a new Flash Tournament.
    ///
    /// ## Arguments
    /// * `entry_fee` - MIST required to join (1 SUI = 1_000_000_000 MIST)
    /// * `seed_hash` - Provably fair seed for course generation
    ///
    /// ## Side Effects
    /// Creates a shared `Tournament` object. Emits `TournamentCreated`.
    ///
    /// ## Security
    /// `seed_hash` should come from a verifiable random function (VRF)
    /// to prevent course manipulation.
    public fun create_tournament(
        entry_fee: u64,
        seed_hash: u256,
        ctx: &mut TxContext,
    ) {
        let creator = tx_context::sender(ctx);
        let tournament = Tournament {
            id: object::new(ctx),
            creator,
            entry_fee,
            max_players: MAX_PLAYERS,
            phase: 0,
            start_time: tx_context::epoch_timestamp_ms(ctx),
            duration_ms: DURATION_SECS * 1000,
            prize_pool: balance::zero<SUI>(),
            player_count: 0,
            top_scores: vector::empty(),
            seed_hash,
        };
        let tournament_id = object::id(&tournament);
        transfer::share_object(tournament);

        event::emit(TournamentCreated {
            tournament_id,
            creator,
            entry_fee,
            max_players: MAX_PLAYERS,
            seed_hash,
        });
    }

    /// Join a tournament by paying the entry fee.
    ///
    /// ## Arguments
    /// * `tournament` - The tournament to join
    /// * `payment` - SUI coin ≥ entry_fee
    ///
    /// ## Side Effects
    /// Transfers `payment` into the prize pool. Creates a `PlayerEntry`
    /// owned by the sender. Emits `PlayerJoined`.
    ///
    /// ## Errors
    /// * `EWrongPhase` - Tournament not in registration
    /// * `ETournamentFull` - Max players reached
    /// * `EInsufficientFee` - Payment less than entry fee
    ///
    /// ## Security
    /// `Coin<SUI>` is consumed via `coin::into_balance` so it cannot
    /// be double-spent. PlayerEntry goes to sender — only they can
    /// submit scores or claim prizes.
    public fun join(
        tournament: &mut Tournament,
        payment: Coin<SUI>,
        ctx: &mut TxContext,
    ) {
        assert!(tournament.phase == 0, EWrongPhase);
        assert!(tournament.player_count < tournament.max_players, ETournamentFull);
        assert!(coin::value(&payment) >= tournament.entry_fee, EInsufficientFee);

        let player = tx_context::sender(ctx);
        let fee_balance = coin::into_balance(payment);
        balance::join(&mut tournament.prize_pool, fee_balance);
        tournament.player_count = tournament.player_count + 1;

        let entry = PlayerEntry {
            id: object::new(ctx),
            player,
            tournament_id: object::id(tournament),
            score_submitted: false,
            final_score: 0,
            prize_claimed: false,
        };
        transfer::transfer(entry, player);

        event::emit(PlayerJoined {
            tournament_id: object::id(tournament),
            player,
            total_players: tournament.player_count,
        });

        if (tournament.player_count >= tournament.max_players) {
            start_tournament(tournament, ctx);
        };
    }

    /// Start the tournament (closes registration).
    /// Called automatically when max_players is reached.
    ///
    /// ## Side Effects
    /// Sets phase to 1 (running). Records start_time for duration.
    /// Once started, no new players can join.
    public fun start_tournament(
        tournament: &mut Tournament,
        ctx: &TxContext,
    ) {
        tournament.phase = 1;
        tournament.start_time = tx_context::epoch_timestamp_ms(ctx);
    }

    /// Submit your final score after completing a run.
    ///
    /// ## Arguments
    /// * `score` - Total points from the run
    /// * `grazing_count` - Times the player grazed obstacles
    /// * `average_angle_error` - Average deviation from correct angle
    ///
    /// ## Side Effects
    /// Inserts score into ranked leaderboard. Auto-ends tournament
    /// if duration has elapsed. Emits `ScoreSubmitted`.
    ///
    /// ## Errors
    /// * `EAlreadySubmitted` - This entry already has a score
    ///
    /// ## Security
    /// Only the PlayerEntry owner can submit. Scores are recorded
    /// as-is — production should verify via ZK proof or signed
    /// game client attestation.
    public fun submit_score(
        tournament: &mut Tournament,
        entry: &mut PlayerEntry,
        score: u64,
        grazing_count: u64,
        average_angle_error: u64,
        ctx: &mut TxContext,
    ) {
        assert!(entry.score_submitted == false, EAlreadySubmitted);

        entry.score_submitted = true;
        entry.final_score = score;

        let player_score = PlayerScore {
            player: entry.player,
            score,
            grazing_count,
            average_angle_error,
            timestamp_ms: tx_context::epoch_timestamp_ms(ctx),
        };

        let len = vector::length(&tournament.top_scores);
        let mut inserted = false;
        let mut i = 0;

        while (i < len) {
            let existing = vector::borrow(&tournament.top_scores, i);
            if (score > existing.score) {
                vector::insert(&mut tournament.top_scores, player_score, i);
                inserted = true;
                break;
            };
            i = i + 1;
        };

        if (!inserted) {
            vector::push_back(&mut tournament.top_scores, player_score);
        };

        let now = tx_context::epoch_timestamp_ms(ctx);
        if (now >= tournament.start_time + tournament.duration_ms) {
            end_tournament(tournament);
        };

        event::emit(ScoreSubmitted {
            tournament_id: object::id(tournament),
            player: entry.player,
            score,
            rank: (i + 1) as u64,
        });
    }

    /// Claim prize after tournament ends
    public fun claim_prize(
        tournament: &mut Tournament,
        entry: &mut PlayerEntry,
        ctx: &mut TxContext,
    ) {
        assert!(tournament.phase == 2, ENotEnded);
        assert!(entry.prize_claimed == false, ENoPrize);

        let total_pool = balance::value(&tournament.prize_pool);
        if (total_pool == 0) { return; };

        let len = vector::length(&tournament.top_scores);
        let mut rank: u64 = 0;
        let mut i = 0;

        while (i < len) {
            let ps = vector::borrow(&tournament.top_scores, i);
            if (ps.player == entry.player) {
                rank = (i + 1) as u64;
                break;
            };
            i = i + 1;
        };

        if (rank == 0 || rank > TOP_PLAYERS) {
            entry.prize_claimed = true;
            return;
        };

        let share_bps: u64 = if (rank == 1) { 5000 }
            else if (rank == 2) { 3000 }
            else { 2000 };

        let prize = (total_pool * share_bps) / 10000;
        let prize_balance = balance::split(&mut tournament.prize_pool, prize);
        let prize_coin = coin::from_balance(prize_balance, ctx);
        transfer::public_transfer(prize_coin, entry.player);

        entry.prize_claimed = true;

        event::emit(PrizeAwarded {
            tournament_id: object::id(tournament),
            player: entry.player,
            amount: prize,
            rank,
        });
    }

    public fun end_tournament(
        tournament: &mut Tournament,
    ) {
        tournament.phase = 2;
    }

    /// Get the current leaderboard (sorted descending by score).
    /// Returns all submitted scores.
    public fun get_top_scores(tournament: &Tournament): vector<PlayerScore> {
        tournament.top_scores
    }

    /// Get the total prize pool in MIST.
    /// Use for frontend display.
    public fun prize_pool_value(tournament: &Tournament): u64 {
        balance::value(&tournament.prize_pool)
    }
}
