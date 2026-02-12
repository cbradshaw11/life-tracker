//
//  EntryFormSheet.swift
//  life-tracker-ios
//

import SwiftUI

struct EntryFormSheet: View {
    @Environment(\.dismiss) private var dismiss
    let date: Date
    let dateString: String
    let trackTypes: [TrackType]
    let editingEntry: Entry?
    let onSubmit: (NewEntry) async throws -> Void
    let onUpdate: (String, EntryUpdates) async throws -> Void
    let onDelete: ((String) async throws -> Void)?
    let onDismissDayDetail: (() -> Void)?

    @State private var selectedTrackTypeId: String = ""
    @State private var valueText: String = ""
    @State private var metadataValues: [String: String] = [:]
    @State private var isSubmitting = false
    @State private var errorMessage: String?

    private static let dateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "EEEE, MMMM d, yyyy"
        return f
    }()

    private var selectedTrackType: TrackType? {
        trackTypes.first { $0.id == selectedTrackTypeId }
    }

    private var metadataKeys: [String] {
        guard let tt = selectedTrackType, let meta = tt.metadata else { return [] }
        return meta.keys.filter { $0 != "__other__" }.sorted()
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Text(Self.dateFormatter.string(from: date))
                        .foregroundStyle(.secondary)
                }
                Section("Activity") {
                    Picker("Track type", selection: $selectedTrackTypeId) {
                        ForEach(trackTypes) { tt in
                            Text(tt.label).tag(tt.id)
                        }
                    }
                    .onChange(of: selectedTrackTypeId) { _, _ in
                        metadataValues = [:]
                    }
                }
                if let tt = selectedTrackType, showsValueField(tt) {
                    Section("Value") {
                        TextField(valueLabel(tt), text: $valueText)
                            .keyboardType(.decimalPad)
                    }
                }
                if !metadataKeys.isEmpty {
                    Section("Metadata") {
                        ForEach(metadataKeys, id: \.self) { key in
                            TextField(key.replacingOccurrences(of: "_", with: " "), text: bindingForKey(key))
                        }
                    }
                }
                if let error = errorMessage {
                    Section {
                        Text(error).foregroundStyle(.red)
                    }
                }
                if editingEntry != nil, onDelete != nil {
                    Section {
                        Button("Delete entry", role: .destructive) { performDelete() }
                    }
                }
            }
            .navigationTitle(editingEntry != nil ? "Edit Entry" : "Add Entry")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { submit() }
                        .disabled(selectedTrackTypeId.isEmpty || isSubmitting)
                }
            }
            .onAppear {
                if let e = editingEntry {
                    selectedTrackTypeId = e.trackTypeId
                    valueText = e.value.map { String(format: "%g", $0) } ?? ""
                    metadataValues = e.metadata ?? [:]
                } else if let first = trackTypes.first {
                    selectedTrackTypeId = first.id
                }
            }
        }
    }

    private func bindingForKey(_ key: String) -> Binding<String> {
        Binding(
            get: { metadataValues[key] ?? "" },
            set: { metadataValues[key] = $0 }
        )
    }

    private func showsValueField(_ tt: TrackType) -> Bool {
        let unit = tt.valueUnit ?? tt.metadata?["unit"]
        return tt.valueType == "duration" || tt.valueType == "count" || (unit != nil && !(unit?.isEmpty ?? true))
    }

    private func valueLabel(_ tt: TrackType) -> String {
        if tt.valueType == "duration" {
            return tt.durationUnit == "hours" ? "Duration (hours)" : "Duration (minutes)"
        }
        let unit = tt.valueUnit ?? tt.metadata?["unit"]
        return unit.map { "Count (\($0))" } ?? "Value"
    }

    private func submit() {
        errorMessage = nil
        isSubmitting = true
        Task {
            do {
                let trimmed = valueText.trimmingCharacters(in: .whitespaces)
                let value: Double? = trimmed.isEmpty ? nil : Double(trimmed)
                let meta = metadataValues.filter { !$0.value.trimmingCharacters(in: .whitespaces).isEmpty }
                if let entry = editingEntry {
                    try await onUpdate(entry.id, EntryUpdates(
                        date: nil,
                        trackTypeId: selectedTrackTypeId,
                        value: value,
                        note: nil,
                        metadata: meta.isEmpty ? nil : meta
                    ))
                } else {
                    try await onSubmit(NewEntry(
                        date: dateString,
                        trackTypeId: selectedTrackTypeId,
                        value: value,
                        note: nil,
                        metadata: meta.isEmpty ? nil : meta
                    ))
                }
                await MainActor.run {
                    dismiss()
                    onDismissDayDetail?()
                }
            } catch {
                await MainActor.run { errorMessage = error.localizedDescription }
            }
            await MainActor.run { isSubmitting = false }
        }
    }

    private func performDelete() {
        guard let entry = editingEntry, let onDelete else { return }
        isSubmitting = true
        Task {
            do {
                try await onDelete(entry.id)
                await MainActor.run {
                    dismiss()
                    onDismissDayDetail?()
                }
            } catch {
                await MainActor.run { errorMessage = error.localizedDescription }
            }
            await MainActor.run { isSubmitting = false }
        }
    }
}
