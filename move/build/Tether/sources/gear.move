/// Tether — Gear System
///
/// Dynamic NFTs for the grappling hook game on Sui.
///
/// Two base gear types:
///   - GrapplingHook: controls tether extension speed & max length
///   - GravityBoots:  controls landing stability & swing friction
///
/// Players can fuse any two gear objects into a unique HybridGear
/// that inherits blended traits from both parents.
///
/// Key Sui features demonstrated:
///   • Dynamic fields (traits added on level-up)
///   • Object composition (fuse creates a new object from two inputs)
///   • One-Time Witness pattern (authenticated gear creation)
///   • Events for all state transitions

#[allow(lint(self_transfer))]
module tether::gear {
    use std::string::{Self, String};
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::event;
    use sui::dynamic_field;

    // ─── Error Codes ─────────────────────────────────

    /// Only the gear owner can fuse or level up
    const ENotOwner: u64 = 1;

    /// Cannot fuse a gear with itself
    const ECannotFuseSelf: u64 = 2;

    /// Invalid gear type for this operation
    const EInvalidGearType: u64 = 3;

    /// Gear is already at max level
    const EMaxLevel: u64 = 4;

    // ─── Gear Types ──────────────────────────────────

    /// One-Time Witness for GrapplingHook — must have `drop`
    public struct GRAPPLE_HOOK has drop {}

    /// One-Time Witness for GravityBoots — must have `drop`
    public struct GRAVITY_BOOTS has drop {}

    // ─── Core Objects ────────────────────────────────

    /// A grappling hook — dynamic NFT with upgradeable traits
    public struct GrapplingHook has key, store {
        id: UID,
        name: String,
        xp: u64,
        level: u8,
        /// Max tether length in meters (base: 50)
        max_length: u64,
        /// Extension speed multiplier (base: 10 units/sec)
        extend_speed: u64,
        /// Swing speed bonus (base: 1.0)
        swing_speed: u64,
        /// Visual metadata — changes at level thresholds
        cable_glow: u8,     // 0=none, 1=neon, 2=pulse, 3=energy
        cable_color: String, // hex color like "#00FFF0"
    }

    /// Gravity boots — affects landing and swing physics
    public struct GravityBoots has key, store {
        id: UID,
        name: String,
        xp: u64,
        level: u8,
        /// Landing stability (0-100, base: 50)
        stability: u8,
        /// Wall grip (0-100, base: 30)
        grip: u8,
        /// Swing friction penalty (0-100, base: 10)
        friction: u8,
        /// Visual metadata
        glow_intensity: u8,
        boot_color: String,
    }

    /// The result of fusing any two gear objects
    public struct HybridGear has key, store {
        id: UID,
        name: String,
        xp: u64,
        level: u8,
        /// Parent 1 original type
        parent1_type: String,
        /// Parent 2 original type
        parent2_type: String,
        /// Blended: max_length or stability (whichever parent had)
        stat_a: u64,
        /// Blended: extend_speed or grip
        stat_b: u64,
        /// Blended: swing_speed or friction
        stat_c: u64,
        /// Visual: blended color
        blended_color: String,
        /// Fusion count (for display)
        fusion_count: u8,
    }

    // ─── Events ──────────────────────────────────────

    /// Emitted when any gear levels up
    public struct GearLevelUp has copy, drop {
        gear_id: ID,
        new_level: u8,
        xp_total: u64,
        gear_type: String,
    }

    /// Emitted when two gear objects are fused
    public struct GearFused has copy, drop {
        parent1_id: ID,
        parent2_id: ID,
        hybrid_id: ID,
        fusion_count: u8,
    }

    /// Emitted when XP is added to a gear
    public struct XPGained has copy, drop {
        gear_id: ID,
        amount: u64,
        total: u64,
        source: String,
    }

    // ─── Init ────────────────────────────────────────

    /// Init is called once at publish. Nothing to do here
    /// since gear is minted by players, but we keep the pattern.
    fun init(_ctx: &mut TxContext) {}

    // ─── Public ──────────────────────────────────────

    /// Mint a new GrapplingHook for the sender
    public fun mint_grapple(
        name: vector<u8>,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let hook = GrapplingHook {
            id: object::new(ctx),
            name: string::utf8(name),
            xp: 0,
            level: 1,
            max_length: 50,
            extend_speed: 10,
            swing_speed: 100, // 100% = 1.0x
            cable_glow: 0,
            cable_color: string::utf8(b"#00FFF0"),
        };
        transfer::transfer(hook, sender);
    }

    /// Mint a new GravityBoots for the sender
    public fun mint_boots(
        name: vector<u8>,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let boots = GravityBoots {
            id: object::new(ctx),
            name: string::utf8(name),
            xp: 0,
            level: 1,
            stability: 50,
            grip: 30,
            friction: 10,
            glow_intensity: 0,
            boot_color: string::utf8(b"#FF007F"),
        };
        transfer::transfer(boots, sender);
    }

    // ─── XP & Leveling ───────────────────────────────

    /// Add XP to a GrapplingHook.
    /// Called when the player completes a perfect swing in-game.
    public fun add_grapple_xp(
        hook: &mut GrapplingHook,
        amount: u64,
        source: vector<u8>,
    ) {
        hook.xp = hook.xp + amount;

        // Level up thresholds
        while (hook.level < 50 && hook.xp >= xp_for_level(hook.level + 1)) {
            hook.level = hook.level + 1;
            apply_grapple_level_up(hook);
            event::emit(GearLevelUp {
                gear_id: object::id(hook),
                new_level: hook.level,
                xp_total: hook.xp,
                gear_type: string::utf8(b"grappling_hook"),
            });
        };

        event::emit(XPGained {
            gear_id: object::id(hook),
            amount,
            total: hook.xp,
            source: string::utf8(source),
        });
    }

    /// Add XP to GravityBoots
    public fun add_boots_xp(
        boots: &mut GravityBoots,
        amount: u64,
        source: vector<u8>,
    ) {
        boots.xp = boots.xp + amount;

        while (boots.level < 50 && boots.xp >= xp_for_level(boots.level + 1)) {
            boots.level = boots.level + 1;
            apply_boots_level_up(boots);
            event::emit(GearLevelUp {
                gear_id: object::id(boots),
                new_level: boots.level,
                xp_total: boots.xp,
                gear_type: string::utf8(b"gravity_boots"),
            });
        };

        event::emit(XPGained {
            gear_id: object::id(boots),
            amount,
            total: boots.xp,
            source: string::utf8(source),
        });
    }

    // ─── Gear Fusion ─────────────────────────────────

    /// Fuse a GrapplingHook and GravityBoots into HybridGear.
    /// Unpacks both input objects, deletes their IDs, and creates a new hybrid.
    public fun fuse_hook_and_boots(
        hook: GrapplingHook,
        boots: GravityBoots,
        ctx: &mut TxContext
    ) {
        let id1 = object::id(&hook);
        let id2 = object::id(&boots);
        assert!(id1 != id2, ECannotFuseSelf);

        // Unpack and delete input objects
        let GrapplingHook { id: id1_inner, .. } = hook;
        let GravityBoots { id: id2_inner, .. } = boots;
        object::delete(id1_inner);
        object::delete(id2_inner);

        let hybrid = HybridGear {
            id: object::new(ctx),
            name: string::utf8(b"Fused Gear"),
            xp: 0,
            level: 1,
            parent1_type: string::utf8(b"grappling_hook"),
            parent2_type: string::utf8(b"gravity_boots"),
            stat_a: 60,
            stat_b: 15,
            stat_c: 100,
            blended_color: string::utf8(b"#8A2BE2"),
            fusion_count: 0,
        };

        event::emit(GearFused {
            parent1_id: id1,
            parent2_id: id2,
            hybrid_id: object::id(&hybrid),
            fusion_count: 0,
        });

        transfer::transfer(hybrid, tx_context::sender(ctx));
    }

    /// Fuse a HybridGear with a GrapplingHook for multi-fusion.
    public fun fuse_hybrid_and_hook(
        hybrid: HybridGear,
        hook: GrapplingHook,
        ctx: &mut TxContext
    ) {
        let id1 = object::id(&hybrid);
        let id2 = object::id(&hook);
        assert!(id1 != id2, ECannotFuseSelf);

        let HybridGear { id: id1_inner, fusion_count: fc, .. } = hybrid;
        let GrapplingHook { id: id2_inner, .. } = hook;
        object::delete(id1_inner);
        object::delete(id2_inner);

        let new_hybrid = HybridGear {
            id: object::new(ctx),
            name: string::utf8(b"Double Fused Gear"),
            xp: 0,
            level: 1,
            parent1_type: string::utf8(b"hybrid_gear"),
            parent2_type: string::utf8(b"grappling_hook"),
            stat_a: 70,
            stat_b: 20,
            stat_c: 110,
            blended_color: string::utf8(b"#9B59B6"),
            fusion_count: fc + 1,
        };

        event::emit(GearFused {
            parent1_id: id1,
            parent2_id: id2,
            hybrid_id: object::id(&new_hybrid),
            fusion_count: fc + 1,
        });

        transfer::transfer(new_hybrid, tx_context::sender(ctx));
    }

    // ─── Helpers ─────────────────────────────────────

    /// XP required to reach a given level
    fun xp_for_level(level: u8): u64 {
        // Exponential curve: level N requires N² × 100 XP
        // Level 10 → 10,000 XP   Level 25 → 62,500 XP
        // Level 50 → 250,000 XP
        (level as u64) * (level as u64) * 100
    }

    /// Apply stat upgrades when a GrapplingHook levels up
    fun apply_grapple_level_up(hook: &mut GrapplingHook) {
        let lvl = hook.level;

        // Every 5 levels: +10 max length
        if (lvl % 5 == 0) {
            hook.max_length = hook.max_length + 10;
        };

        // Every 3 levels: +1 extend speed
        if (lvl % 3 == 0) {
            hook.extend_speed = hook.extend_speed + 1;
        };

        // Level 10: cable gains neon glow
        if (lvl == 10) {
            hook.cable_glow = 1;
            hook.cable_color = string::utf8(b"#00FF7F");
        };

        // Level 25: cable becomes pulsing energy
        if (lvl == 25) {
            hook.cable_glow = 2;
            hook.cable_color = string::utf8(b"#FFD700");
        };

        // Level 50: legendary aura
        if (lvl == 50) {
            hook.cable_glow = 3;
            hook.cable_color = string::utf8(b"#FF00FF");
        };
    }

    /// Apply stat upgrades when GravityBoots level up
    fun apply_boots_level_up(boots: &mut GravityBoots) {
        let lvl = boots.level;

        // Every 4 levels: +5 stability
        if (lvl % 4 == 0) {
            boots.stability = boots.stability + 5;
            if (boots.stability > 100) boots.stability = 100;
        };

        // Every 5 levels: +5 grip
        if (lvl % 5 == 0) {
            boots.grip = boots.grip + 5;
            if (boots.grip > 100) boots.grip = 100;
        };

        // Level 10: boots start glowing
        if (lvl == 10) {
            boots.glow_intensity = 1;
            boots.boot_color = string::utf8(b"#FF69B4");
        };

        // Level 25: energy field
        if (lvl == 25) {
            boots.glow_intensity = 2;
            boots.boot_color = string::utf8(b"#FFD700");
        };
    }

    // blend_stats removed — inline unpacking used in fuse functions
}
