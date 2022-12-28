Hooks.once("setup", () => {
    game.modules.get("pf2e-eidolon-sync").api = {
        setSync,
        removeSync,
        setMaxHp
    }
})

Hooks.on('preUpdateActor', async function (character, change) {

    const syncActorUuid = character.getFlag("pf2e-eidolon-sync", "syncActor");
    if (syncActorUuid) {
        const syncActor = fromUuidSync(syncActorUuid);

        syncHeroPoints(syncActor, change);
        if (character.getFlag("pf2e-eidolon-sync", "onlyHero")) { return; }
        syncHp(syncActor, change);
    }
});

function syncHeroPoints(syncActor, change) {
    if (!change.system?.resources?.heroPoints) { return; }
    const update = syncActor.system.resources.heroPoints;
    update.value = change.system.resources.heroPoints.value;
    syncActor.update({ "system.resources.heroPoints": update }, { "noHook": true });
}

function syncHp(syncActor, change) {

    if (!change.system?.attributes?.hp) { return; }

    const update = syncActor.system.attributes.hp;
    update.value = change.system.attributes.hp.value;
    update.temp = change.system.attributes.hp.temp;
    syncActor.update({ "system.attributes.hp": update }, { "noHook": true });

}

export async function setMaxHp(actor) {

    const id = actor.itemTypes.effect.find(e => e.name === 'Sync hp')?.id;

    if (!id) {
        const effect = await fromUuid("Compendium.pf2e-eidolon-sync.sync-eidolon-effect.lHTkZN0MKZ1yhWQw");
        await actor.createEmbeddedDocuments("Item", [effect]);
        return setMaxHp(actor);
    }

    const syncActor = fromUuidSync(actor.getFlag("pf2e-eidolon-sync", "syncActor"));
    const value = syncActor.system.attributes.hp.max;
    const effect = actor.getEmbeddedDocument("Item", id).toObject();
    effect.system.rules[0].value = value;

    await actor.updateEmbeddedDocuments("Item", [effect]);

    syncHp(actor, syncActor);
}

export function setSync(character, syncActor, onlyHero) {
    character.setFlag("pf2e-eidolon-sync", "syncActor", syncActor.uuid);
    syncActor.setFlag("pf2e-eidolon-sync", "syncActor", character.uuid);
    ui.notifications.info("Synchronisation added between " + character.name + " and " + syncActor.name);

}

export function removeSync(character) {
    const syncActorUuid = character.getFlag("pf2e-eidolon-sync", "syncActor");
    if (!syncActorUuid) { return; }
    character.unsetFlag("pf2e-eidolon-sync", "syncActor");
    const syncActor = fromUuidSync(syncActorUuid);
    syncActor.unsetFlag("pf2e-eidolon-sync", "syncActor");
    ui.notifications.info("Synchronisation removed between " + character.name + " and " + syncActor.name);
}