//
//  EditTrackTypeSheetView.swift
//  life-tracker-ios
//

import SwiftUI

struct EditTrackTypeSheetView: View {
    let trackType: TrackType
    @EnvironmentObject var dataStore: DataStore

    var body: some View {
        AddTrackTypeSheet(
            title: "Edit Entry Type",
            existing: trackType,
            onSave: saveHandler,
            onDelete: deleteHandler
        )
    }

    private func saveHandler(_ updated: TrackType) async throws {
        let updates = TrackTypeUpdates(
            label: updated.label,
            color: updated.color,
            valueType: updated.valueType,
            valueUnit: updated.valueUnit,
            durationUnit: updated.durationUnit,
            metadata: updated.metadata
        )
        try await dataStore.updateTrackType(id: trackType.id, updates: updates)
    }

    private var deleteHandler: (() async throws -> Void)? {
        guard dataStore.trackTypes.count > 1 else { return nil }
        return {
            try await dataStore.deleteTrackType(id: trackType.id)
        }
    }
}
