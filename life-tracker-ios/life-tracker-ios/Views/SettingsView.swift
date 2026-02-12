//
//  SettingsView.swift
//  life-tracker-ios
//

import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var dataStore: DataStore
    @State private var showAddSheet = false
    @State private var editingTrackType: TrackType?
    @State private var showExportSheet = false
    @State private var exportURL: URL?
    @State private var exportError: String?

    var body: some View {
        SettingsScrollContent(
            editingTrackType: $editingTrackType,
            onAddTap: { showAddSheet = true },
            onExportTap: performExport
        )
        .sheet(isPresented: $showAddSheet) {
            AddTrackTypeSheet(
                title: "Create Entry Type",
                existing: nil,
                onSave: { tt in _ = try await dataStore.addTrackType(tt) },
                onDelete: nil
            )
        }
        .sheet(item: $editingTrackType) { tt in
            EditTrackTypeSheetView(trackType: tt)
        }
        .sheet(isPresented: $showExportSheet) {
            SettingsExportSheet(url: exportURL, error: exportError)
        }
    }

    private func performExport() {
        struct ExportPayload: Encodable {
            let entries: [Entry]
            let trackTypes: [TrackType]
            let exportedAt: String
        }
        let payload = ExportPayload(
            entries: dataStore.entries,
            trackTypes: dataStore.trackTypes,
            exportedAt: ISO8601DateFormatter().string(from: Date())
        )
        do {
            let encoder = JSONEncoder()
            encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
            let data = try encoder.encode(payload)
            let fileName = "life-tracker-export-\(DateFormatter.yyyyMMdd.string(from: Date())).json"
            let url = FileManager.default.temporaryDirectory.appendingPathComponent(fileName)
            try data.write(to: url)
            exportURL = url
            exportError = nil
            showExportSheet = true
        } catch {
            exportError = error.localizedDescription
            exportURL = nil
            showExportSheet = true
        }
    }
}

private struct SettingsExportSheet: View {
    let url: URL?
    let error: String?

    var body: some View {
        Group {
            if let url {
                ShareSheet(items: [url])
            } else if let error {
                Text("Export failed: \(error)")
                    .padding()
            }
        }
    }
}

struct TrackTypeCardView: View {
    let trackType: TrackType
    let countPastMonth: Int
    let countPastYear: Int
    let canDelete: Bool
    let onEdit: () -> Void
    let onDelete: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Circle()
                    .fill(Color(hex: trackType.color))
                    .frame(width: 12, height: 12)
                Text(trackType.label)
                    .font(.headline)
                Spacer()
            }
            HStack(spacing: 16) {
                Text("\(countPastMonth) \(countPastMonth == 1 ? "entry" : "entries") past month")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Text("\(countPastYear) \(countPastYear == 1 ? "entry" : "entries") past year")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            HStack {
                Button("Edit", action: onEdit)
                    .buttonStyle(.bordered)
                Button("Remove", role: .destructive, action: onDelete)
                    .buttonStyle(.bordered)
                    .disabled(!canDelete)
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 12))
    }
}

// ShareSheet for exporting (share sheet or save to Files)
private extension DateFormatter {
    static let yyyyMMdd: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()
}

struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }

    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}
