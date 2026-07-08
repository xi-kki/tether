/// Tether — Gear Test Suite

#[test_only]
module tether::gear_tests {
    use tether::gear::{Self, GrapplingHook, GravityBoots, HybridGear};
    use sui::test_scenario;

    #[test]
    fun test_mint_grapple() {
        let owner = @0xA;
        let scenario = test_scenario::begin(owner);

        test_scenario::next_tx(&mut scenario, owner);
        {
            gear::mint_grapple(b"CyberHook", test_scenario::ctx(&mut scenario));
        };

        test_scenario::next_tx(&mut scenario, owner);
        {
            let hook = test_scenario::take_from_sender<GrapplingHook>(&scenario);
            assert!(hook.level == 1, 0);
            assert!(hook.max_length == 50, 1);
            assert!(hook.xp == 0, 2);
            test_scenario::return_to_sender(&scenario, hook);
        };

        test_scenario::end(scenario);
    }

    #[test]
    fun test_mint_boots() {
        let owner = @0xB;
        let scenario = test_scenario::begin(owner);

        test_scenario::next_tx(&mut scenario, owner);
        {
            gear::mint_boots(b"QuantumStompers", test_scenario::ctx(&mut scenario));
        };

        test_scenario::next_tx(&mut scenario, owner);
        {
            let boots = test_scenario::take_from_sender<GravityBoots>(&scenario);
            assert!(boots.stability == 50, 0);
            assert!(boots.level == 1, 1);
            assert!(boots.grip == 30, 2);
            test_scenario::return_to_sender(&scenario, boots);
        };

        test_scenario::end(scenario);
    }

    #[test]
    fun test_add_grapple_xp() {
        let owner = @0xA;
        let scenario = test_scenario::begin(owner);

        test_scenario::next_tx(&mut scenario, owner);
        {
            gear::mint_grapple(b"TestHook", test_scenario::ctx(&mut scenario));
        };

        // Add enough XP to reach level 2 (400 XP needed)
        test_scenario::next_tx(&mut scenario, owner);
        {
            let hook = test_scenario::take_from_sender<GrapplingHook>(&scenario);
            gear::add_grapple_xp(&mut hook, 500, b"perfect_swing");
            assert!(hook.level >= 2, 0);
            assert!(hook.xp == 500, 1);
            test_scenario::return_to_sender(&scenario, hook);
        };

        test_scenario::end(scenario);
    }

    #[test]
    fun test_fuse_hook_and_boots() {
        let owner = @0xA;
        let scenario = test_scenario::begin(owner);

        test_scenario::next_tx(&mut scenario, owner);
        {
            gear::mint_grapple(b"FireHook", test_scenario::ctx(&mut scenario));
            gear::mint_boots(b"IceBoots", test_scenario::ctx(&mut scenario));
        };

        test_scenario::next_tx(&mut scenario, owner);
        {
            let hook = test_scenario::take_from_sender<GrapplingHook>(&scenario);
            let boots = test_scenario::take_from_sender<GravityBoots>(&scenario);
            gear::fuse_hook_and_boots(hook, boots, test_scenario::ctx(&mut scenario));
        };

        test_scenario::next_tx(&mut scenario, owner);
        {
            let hybrid = test_scenario::take_from_sender<HybridGear>(&scenario);
            assert!(hybrid.level == 1, 0);
            test_scenario::return_to_sender(&scenario, hybrid);
        };

        test_scenario::end(scenario);
    }
}
