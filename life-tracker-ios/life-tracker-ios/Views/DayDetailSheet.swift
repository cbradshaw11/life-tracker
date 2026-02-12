//
//  DayDetailSheet.swift
//  life-tracker-ios
//

import SwiftUI

struct DayDetailSheet: View {
    @Environment(\.dismiss) private var dismiss
    let date: Date
    let dayEntries: [Entry]
    let trackTypes: [TrackType]
    let onEdit: (Entry) -> Void
    let onDelete: (String) -> Void
    let onSubmitNewEntry: (NewEntry) async throws -> Void

    @State private var showAddEntryForm = false

    private static let titleFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "EEEE, MMMM d, yyyy"
        return f
    }()

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 16) {
                if dayEntries.isEmpty {
                    Text("No entries for this day.")
                        .foregroundStyle(.secondary)
                        .padding()
                } else {
                    List {
                        ForEach(dayEntries) { entry in
                            if let tt = trackTypes.first(where: { $0.id == entry.trackTypeId }) {
                                EntryRowView(
                                    entry: entry,
                                    trackType: tt,
                                    onTap: { onEdit(entry) },
                                    onDelete: { onDelete(entry.id) }
                                )
                            }
                        }
                    }
                    .listStyle(.plain)
                }
                HStack(spacing: 12) {
                    Button("Close") { dismiss() }
                        .buttonStyle(.bordered)
                        .frame(maxWidth: .infinity)
                    Button("Add entry") { showAddEntryForm = true }
                        .buttonStyle(.borderedProminent)
                        .frame(maxWidth: .infinity)
                }
            }
            .padding()
            .navigationTitle(Self.titleFormatter.string(from: date))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button { dismiss() } label: { Image(systemName: "xmark.circle.fill") }
                }
            }
            .sheet(isPresented: $showAddEntryForm) {
                EntryFormSheet(
                    date: date,
                    dateString: Date.dateString(from: date),
                    trackTypes: trackTypes,
                    editingEntry: nil,
                    onSubmit: onSubmitNewEntry,
                    onUpdate: { _, _ in },
                    onDelete: nil,
                    onDismissDayDetail: {
                        showAddEntryForm = false
                        dismiss()
                    }
                )
            }
        }
    }
}

struct EntryRowView: View {
    let entry: Entry
    let trackType: TrackType
    let onTap: () -> Void
    let onDelete: () -> Void

    var body: some View {
        HStack {
            Button(action: onTap) {
                HStack(spacing: 8) {
                    Circle()
                        .fill(Color(hex: trackType.color))
                        .frame(width: 10, height: 10)
                    Text(trackType.label)
                        .font(.subheadline.weight(.medium))
                    if let valueLabel = FormatValue.formatEntryValue(entry, trackType: trackType) {
                        Text(valueLabel)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    if let meta = entry.metadata, !meta.isEmpty {
                        ForEach(Array(meta.keys.sorted()), id: \.self) { k in
                            if let v = meta[k], !v.isEmpty {
                                Text("\(k.replacingOccurrences(of: "_", with: " ")): \(v)")
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .buttonStyle(.plain)
            Button(action: onDelete) {
                Image(systemName: "trash")
                    .foregroundStyle(.red)
            }
        }
    }
}
