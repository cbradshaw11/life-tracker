//
//  AddTrackTypeSheet.swift
//  life-tracker-ios
//

import SwiftUI

enum MetadataKeyOption: String, CaseIterable {
    case unit = "unit"
    case category = "category"
    case daily_goal = "daily_goal"
    case intensity = "intensity"
    case location = "location"
    case other = "__other__"

    var label: String {
        switch self {
        case .unit: return "Unit"
        case .category: return "Category"
        case .daily_goal: return "Daily goal"
        case .intensity: return "Intensity"
        case .location: return "Location"
        case .other: return "Other (custom)"
        }
    }
}

struct MetadataEntry: Identifiable {
    let id = UUID()
    var key: String
    var value: String
}

struct AddTrackTypeSheet: View {
    @Environment(\.dismiss) private var dismiss
    let title: String
    let existing: TrackType?
    let onSave: (TrackType) async throws -> Void
    let onDelete: (() async throws -> Void)?

    @State private var label = ""
    @State private var color = "#3b82f6"
    @State private var metadataEntries: [MetadataEntry] = []
    @State private var showMetadata = false
    @State private var isSaving = false
    @State private var errorMessage: String?

    static let colors = [
        "#ef4444", "#f97316", "#eab308", "#22c55e",
        "#14b8a6", "#3b82f6", "#8b5cf6", "#ec4899",
    ]

    var body: some View {
        NavigationStack {
            Form {
                Section("Label") {
                    TextField("e.g. Meditation", text: $label)
                }
                Section("Color") {
                    LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 4), spacing: 12) {
                        ForEach(Self.colors, id: \.self) { c in
                            Button {
                                color = c
                            } label: {
                                Circle()
                                    .fill(Color(hex: c))
                                    .frame(width: 36, height: 36)
                                    .overlay {
                                        if color == c {
                                            Circle()
                                                .strokeBorder(.primary, lineWidth: 2)
                                        }
                                    }
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
                Section("Optional metadata") {
                    if showMetadata {
                        ForEach(metadataEntries) { e in
                            MetadataRowView(
                                key: bindingForKey(e.id),
                                value: bindingForValue(e.id),
                                onRemove: { metadataEntries.removeAll { $0.id == e.id }; if metadataEntries.isEmpty { showMetadata = false } }
                            )
                        }
                        Button("+ Add another metadata field") {
                            metadataEntries.append(MetadataEntry(key: "", value: ""))
                        }
                    } else {
                        Button("+ Add optional metadata") {
                            showMetadata = true
                            metadataEntries.append(MetadataEntry(key: "", value: ""))
                        }
                    }
                }
                if let error = errorMessage {
                    Section {
                        Text(error).foregroundStyle(.red)
                    }
                }
            }
            .navigationTitle(title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { save() }
                        .disabled(label.trimmingCharacters(in: .whitespaces).isEmpty || isSaving)
                }
                if let onDelete, existing != nil {
                    ToolbarItem(placement: .destructiveAction) {
                        Button("Delete", role: .destructive) { performDelete() }
                    }
                }
            }
            .onAppear {
                if let e = existing {
                    label = e.label
                    color = e.color
                    if let meta = e.metadata, !meta.isEmpty {
                        showMetadata = true
                        metadataEntries = meta.map { MetadataEntry(key: $0.key, value: $0.value) }
                    }
                }
            }
        }
    }

    private func bindingForKey(_ id: UUID) -> Binding<String> {
        Binding(
            get: { metadataEntries.first(where: { $0.id == id })?.key ?? "" },
            set: { new in if let i = metadataEntries.firstIndex(where: { $0.id == id }) { metadataEntries[i].key = new } }
        )
    }

    private func bindingForValue(_ id: UUID) -> Binding<String> {
        Binding(
            get: { metadataEntries.first(where: { $0.id == id })?.value ?? "" },
            set: { new in if let i = metadataEntries.firstIndex(where: { $0.id == id }) { metadataEntries[i].value = new } }
        )
    }

    private func buildMetadata() -> [String: String]? {
        let d = metadataEntries
            .filter { !$0.key.trimmingCharacters(in: .whitespaces).isEmpty && $0.key != "__other__" }
            .reduce(into: [String: String]()) { $0[$1.key.trimmingCharacters(in: .whitespaces)] = $1.value }
        return d.isEmpty ? nil : d
    }

    private func save() {
        errorMessage = nil
        isSaving = true
        Task {
            do {
                let meta = buildMetadata()
                let tt = TrackType(
                    id: existing?.id ?? UUID().uuidString,
                    label: label.trimmingCharacters(in: .whitespaces),
                    color: color,
                    valueType: "count",
                    valueUnit: nil,
                    durationUnit: nil,
                    metadata: meta
                )
                try await onSave(tt)
                await MainActor.run { dismiss() }
            } catch {
                await MainActor.run { errorMessage = error.localizedDescription }
            }
            await MainActor.run { isSaving = false }
        }
    }

    private func performDelete() {
        guard let onDelete else { return }
        isSaving = true
        Task {
            do {
                try await onDelete()
                await MainActor.run { dismiss() }
            } catch {
                await MainActor.run { errorMessage = error.localizedDescription }
            }
            await MainActor.run { isSaving = false }
        }
    }
}

struct MetadataRowView: View {
    @Binding var key: String
    @Binding var value: String
    var onRemove: () -> Void

    @State private var selectedPreset: String = ""

    private var isOther: Bool { selectedPreset == MetadataKeyOption.other.rawValue }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Picker("Key", selection: $selectedPreset) {
                    Text("Select key…").tag("")
                    ForEach(MetadataKeyOption.allCases, id: \.rawValue) { o in
                        Text(o.label).tag(o.rawValue)
                    }
                }
                .onChange(of: selectedPreset) { _, new in
                    if new != MetadataKeyOption.other.rawValue {
                        key = new
                    } else {
                        key = ""
                    }
                }
                Button(action: onRemove) {
                    Image(systemName: "trash").foregroundStyle(.secondary)
                }
            }
            if isOther {
                TextField("Custom key", text: $key)
            }
            TextField("Value", text: $value)
        }
        .onAppear {
            if let opt = MetadataKeyOption(rawValue: key) {
                selectedPreset = opt.rawValue
            } else if !key.isEmpty {
                selectedPreset = MetadataKeyOption.other.rawValue
            }
        }
    }
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3:
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6:
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8:
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
