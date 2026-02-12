//
//  SettingsScrollContent.swift
//  life-tracker-ios
//

import SwiftUI

struct SettingsScrollContent: View {
    @EnvironmentObject var dataStore: DataStore
    @Binding var editingTrackType: TrackType?
    let onAddTap: () -> Void
    let onExportTap: () -> Void

    var body: some View {
        SettingsScrollContentInner(
            editingTrackType: $editingTrackType,
            onAddTap: onAddTap,
            onExportTap: onExportTap
        )
    }
}

private struct SettingsScrollContentInner: View {
    @EnvironmentObject var dataStore: DataStore
    @Binding var editingTrackType: TrackType?
    let onAddTap: () -> Void
    let onExportTap: () -> Void

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                headerSection
                emptyStateView
                trackTypesList
                addButton
                exportButton
            }
            .padding()
        }
    }

    private var headerSection: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Entry Types")
                .font(.title.bold())
            Text("Your entry types and their usage")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
    }

    private var emptyStateView: some View {
        Group {
            if dataStore.trackTypes.isEmpty {
                Text("No entry types yet. Create one below or add your first entry from the calendar.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding()
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 24)
            }
        }
    }

    private var trackTypesList: some View {
        ForEach(dataStore.trackTypes, id: \.id) { tt in
            SettingsTrackTypeRow(
                trackType: tt,
                editingTrackType: $editingTrackType,
                canDelete: dataStore.trackTypes.count > 1
            )
        }
    }

    private var addButton: some View {
        Button(action: onAddTap) {
            Label("Add entry type", systemImage: "plus.circle.fill")
                .frame(maxWidth: .infinity)
                .padding()
        }
        .buttonStyle(.bordered)
    }

    private var exportButton: some View {
        Button(action: onExportTap) {
            Label("Export data", systemImage: "square.and.arrow.up")
                .frame(maxWidth: .infinity)
                .padding()
        }
        .buttonStyle(.bordered)
    }
}

private struct SettingsTrackTypeRow: View {
    let trackType: TrackType
    @Binding var editingTrackType: TrackType?
    let canDelete: Bool
    @EnvironmentObject var dataStore: DataStore

    var body: some View {
        TrackTypeCardView(
            trackType: trackType,
            countPastMonth: dataStore.entryCountPastMonth(trackTypeId: trackType.id),
            countPastYear: dataStore.entryCountPastYear(trackTypeId: trackType.id),
            canDelete: canDelete,
            onEdit: setEditingToThis,
            onDelete: deleteThis
        )
    }

    private func setEditingToThis() {
        editingTrackType = trackType
    }

    private func deleteThis() {
        Task {
            try? await dataStore.deleteTrackType(id: trackType.id)
        }
    }
}
