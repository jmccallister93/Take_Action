import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, Switch } from "react-native";
import { theme } from "../../theme";
import { useState, useEffect } from "react";
import { Picker } from "@react-native-picker/picker";
import { useCharacter } from "../context/CharacterContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function ActivityLogScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    // Get categoryId from URL parameters
    const categoryId = typeof params.category === 'string' ? params.category : undefined;

    const { characterSheet, logActivity } = useCharacter();

    const [activity, setActivity] = useState("");
    const [selectedStats, setSelectedStats] = useState<string[]>([]);
    const [pointsValue, setPointsValue] = useState(1);
    const [isNegative, setIsNegative] = useState(false);
    const [errors, setErrors] = useState({ activity: "", stat: "", points: "" });
    const [availableStats, setAvailableStats] = useState<string[]>([]);
    const [categoryName, setCategoryName] = useState("");
    const [categoryGradient, setCategoryGradient] = useState<[string, string]>(['#6366F1', '#8B5CF6']);

    // Set up available stats based on selected category
    useEffect(() => {
        if (!categoryId || !characterSheet.categories[categoryId]) {
            // If no category ID or invalid category, redirect back
            console.error("Invalid category ID:", categoryId);
            router.back();
            return;
        }

        const category = characterSheet.categories[categoryId];

        // Set category name and gradient for UI
        setCategoryName(category.name);
        setCategoryGradient(category.gradient);

        // Set up available stats
        if (category.stats && category.stats.length > 0) {
            const stats = category.stats.map(stat => stat.name);
            setAvailableStats(stats);

            // Preselect the first stat
            if (stats.length > 0) {
                setSelectedStats([]);
            }
        } else {
            // No stats available
            setAvailableStats([]);
        }
    }, [categoryId, characterSheet]);

    const toggleStatSelection = (stat: string) => {
        setSelectedStats(prev => {
            if (prev.includes(stat)) {
                // Remove the stat if already selected
                return prev.filter(item => item !== stat);
            } else {
                // Add the stat if not already selected
                return [...prev, stat];
            }
        });
    };

    const previousScreen = typeof params.from === 'string' ? params.from : undefined;

    const handleCancel = () => {
        if (previousScreen) {
            // Navigate directly to the previous screen
            router.push(previousScreen);
        } else {
            // Fallback to a default screen like activity history
            router.push("/activity-history");
        }
    };

    const validateForm = () => {
        let valid = true;
        const newErrors = { activity: "", stat: "", points: "" };

        if (!activity.trim()) {
            newErrors.activity = "Please describe your activity";
            valid = false;
        }

        if (pointsValue < 1 || pointsValue > 5) {
            newErrors.points = "Points must be between 1 and 5";
            valid = false;
        }

        setErrors(newErrors);
        return valid;
    };
    const handleSave = () => {
        if (!validateForm() || !categoryId) return;

        // Apply negative sign if the negative toggle is on
        const finalPoints = isNegative ? -pointsValue : pointsValue;

        // Use the selectedStats array or fall back to the category name if empty
        const statsToApply = selectedStats.length > 0 ? selectedStats : [categoryName];

        logActivity(
            activity,
            categoryId,
            statsToApply,
            finalPoints
        );

        setActivity("");

        // Navigate back
        router.back();
    };

    // Get examples of activities for the selected category
    const getActivityExamples = () => {
        if (isNegative) {
            return `E.g., 'Skipped practice', 'Made a mistake in ${categoryName}'`;
        } else {
            return `E.g., 'Made progress in ${categoryName}', 'Practiced for 30 minutes'`;
        }
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={styles.container} key={categoryId}>
                <LinearGradient
                    colors={categoryGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.header}
                >
                    <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>

                    <Text style={styles.title}>{categoryName} Activity</Text>
                    <Text style={styles.subtitle}>
                        {isNegative
                            ? `What negatively affected your ${categoryName} attributes?`
                            : `What did you do to improve your ${categoryName} attributes?`
                        }
                    </Text>
                </LinearGradient>

                <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContainer}>
                    <View style={styles.card}>
                        {/* Toggle for positive/negative impact */}
                        <View style={styles.toggleContainer}>
                            <Text style={styles.toggleLabel}>
                                {isNegative ? "Negative Impact" : "Positive Impact"}
                            </Text>
                            <Switch
                                value={isNegative}
                                onValueChange={setIsNegative}
                                trackColor={{ false: theme.colorSuccess, true: theme.colorDanger }}
                                thumbColor="#fff"
                                ios_backgroundColor={theme.colorSuccess}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Activity Description</Text>
                            <TextInput
                                style={styles.input}
                                value={activity}
                                onChangeText={setActivity}
                                placeholder={getActivityExamples()}
                                placeholderTextColor={theme.colorTextLight}
                                multiline
                                numberOfLines={3}
                            />
                            {errors.activity ? <Text style={styles.errorText}>{errors.activity}</Text> : null}
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>{isNegative ? "Attributes Affected" : "Attributes Improved"}</Text>
                            <View style={styles.statsContainer}>
                                {availableStats.map((stat) => (
                                    <TouchableOpacity
                                        key={stat}
                                        style={[
                                            styles.statButton,
                                            selectedStats.includes(stat) && (
                                                isNegative ? styles.negativeStatButton : styles.positiveStatButton
                                            )
                                        ]}
                                        onPress={() => toggleStatSelection(stat)}
                                    >
                                        <Text
                                            style={[
                                                styles.statButtonText,
                                                selectedStats.includes(stat) && (
                                                    isNegative ? styles.negativeStatButtonText : styles.positiveStatButtonText
                                                )
                                            ]}
                                        >
                                            {stat}
                                        </Text>
                                        {selectedStats.includes(stat) && (
                                            <Ionicons
                                                name="checkmark-circle"
                                                size={16}
                                                color="white"
                                                style={styles.checkIcon}
                                            />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                            {errors.stat ? <Text style={styles.errorText}>{errors.stat}</Text> : null}
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Impact Level (1-5)</Text>
                            <View style={styles.pointsContainer}>
                                <Text style={styles.pointsHint}>Slight</Text>
                                {[1, 2, 3, 4, 5].map((value) => (
                                    <TouchableOpacity
                                        key={value}
                                        style={[
                                            styles.pointButton,
                                            pointsValue === value && (
                                                isNegative ? styles.negativePointButton : styles.positivePointButton
                                            )
                                        ]}
                                        onPress={() => setPointsValue(value)}
                                    >
                                        <Text
                                            style={[
                                                styles.pointButtonText,
                                                pointsValue === value && (
                                                    isNegative ? styles.negativePointButtonText : styles.positivePointButtonText
                                                )
                                            ]}
                                        >
                                            {value}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                                <Text style={styles.pointsHint}>Significant</Text>
                            </View>
                            {errors.points ? <Text style={styles.errorText}>{errors.points}</Text> : null}
                        </View>
                    </View>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.saveButton,
                                isNegative && styles.negativeSaveButton
                            ]}
                            onPress={handleSave}
                        >
                            <Text style={styles.saveButtonText}>Save Activity</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colorBackground,
    },
    header: {
        paddingTop: 50, // For status bar
        paddingBottom: 20,
        paddingHorizontal: theme.spacing.lg,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: theme.spacing.xs,
        color: 'white',
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        marginBottom: theme.spacing.sm,
    },
    scrollContent: {
        flex: 1,
    },
    scrollContainer: {
        padding: theme.spacing.lg,
    },
    card: {
        backgroundColor: theme.colorCard,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        ...theme.shadow.md,
        marginBottom: theme.spacing.lg,
    },
    toggleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
        paddingBottom: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colorBorder,
    },
    toggleLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colorText,
    },
    formGroup: {
        marginBottom: theme.spacing.lg,
    },
    label: {
        fontSize: 16,
        marginBottom: theme.spacing.sm,
        fontWeight: '500',
        color: theme.colorText,
    },
    input: {
        backgroundColor: theme.colorBackground,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        fontSize: 16,
        borderWidth: 1,
        borderColor: theme.colorBorder,
        textAlignVertical: 'top',
        color: theme.colorText,
        minHeight: 100,
    },
    pickerContainer: {
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colorBorder,
        overflow: 'hidden',
        backgroundColor: theme.colorBackground,
    },
    picker: {
        height: 50,
        width: '100%',
        backgroundColor: theme.colorBackground,
    },
    androidPicker: {
        height: 50,
        width: '100%',
        color: theme.colorText,
        backgroundColor: theme.colorBackground,
    },
    pointsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pointsHint: {
        fontSize: 12,
        color: theme.colorTextSecondary,
        marginHorizontal: 8,
    },
    pointButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.colorBorder,
        backgroundColor: theme.colorBackground,
        justifyContent: 'center',
        alignItems: 'center',
        margin: 4,
    },
    positivePointButton: {
        backgroundColor: theme.colorPrimary,
        borderColor: theme.colorPrimary,
    },
    negativePointButton: {
        backgroundColor: theme.colorDanger,
        borderColor: theme.colorDanger,
    },
    pointButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colorTextSecondary,
    },
    positivePointButtonText: {
        color: 'white',
    },
    negativePointButtonText: {
        color: 'white',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: theme.spacing.md,
        marginBottom: theme.spacing.xxl,
    },
    cancelButton: {
        backgroundColor: theme.colorBackground,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        flex: 1,
        marginRight: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colorBorder,
    },
    cancelButtonText: {
        color: theme.colorTextSecondary,
        fontSize: 16,
        fontWeight: 'bold',
    },
    saveButton: {
        backgroundColor: theme.colorPrimary,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        flex: 1,
        marginLeft: 10,
        alignItems: 'center',
    },
    negativeSaveButton: {
        backgroundColor: theme.colorDanger,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    errorText: {
        color: theme.colorDanger,
        fontSize: 14,
        marginTop: 5,
    },
    statsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: theme.spacing.xs,
    },
    statButton: {
        backgroundColor: theme.colorBackground,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colorBorder,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        marginRight: theme.spacing.sm,
        marginBottom: theme.spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
    },
    positiveStatButton: {
        backgroundColor: theme.colorPrimary,
        borderColor: theme.colorPrimary,
    },
    negativeStatButton: {
        backgroundColor: theme.colorDanger,
        borderColor: theme.colorDanger,
    },
    statButtonText: {
        fontSize: 14,
        color: theme.colorText,
    },
    positiveStatButtonText: {
        color: 'white',
    },
    negativeStatButtonText: {
        color: 'white',
    },
    checkIcon: {
        marginLeft: theme.spacing.xs,
    },
});