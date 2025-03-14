// app/components/DecaySettingsComponent.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Switch,
    Modal,
    TextInput,
    ScrollView,
    Alert
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { useDecayTimer, DecaySetting } from '../context/DecayTimerContext';

type DecaySettingsProps = {
    categoryId: string;
    statName: string;
    isVisible: boolean;
    onClose: () => void;
};

const DecaySettingsComponent: React.FC<DecaySettingsProps> = ({
    categoryId,
    statName,
    isVisible,
    onClose
}) => {
    const {
        addDecaySetting,
        updateDecaySetting,
        removeDecaySetting,
        getSettingKey,
        getDecaySettingForStat,
        getTimeUntilNextDecay
    } = useDecayTimer();

    // Local state for form
    const [decayEnabled, setDecayEnabled] = useState(false);
    const [decayPoints, setDecayPoints] = useState('1');
    const [decayTimeValue, setDecayTimeValue] = useState('3');
    const [hasExistingSetting, setHasExistingSetting] = useState(false);
    const [timeUntilDecay, setTimeUntilDecay] = useState<{ days: number, hours: number, minutes: number } | null>(null);
    const [timeUnit, setTimeUnit] = useState<'minutes' | 'hours' | 'days'>('days');

    // Load existing setting if available and update time until decay
    useEffect(() => {
        if (isVisible) {
            const existingSetting = getDecaySettingForStat(categoryId, statName);

            if (existingSetting) {
                setDecayEnabled(existingSetting.enabled);
                setDecayPoints(existingSetting.points.toString());
                setDecayTimeValue(existingSetting.timeValue.toString());
                setTimeUnit(existingSetting.timeUnit);
                setHasExistingSetting(true);

                // Get time until next decay
                if (existingSetting.enabled) {
                    const timeLeft = getTimeUntilNextDecay(categoryId, statName);
                    setTimeUntilDecay(timeLeft);
                } else {
                    setTimeUntilDecay(null);
                }
            } else {
                // Reset to defaults if no existing setting
                setDecayEnabled(false);
                setDecayPoints('1');
                setDecayTimeValue('3');
                setHasExistingSetting(false);
                setTimeUntilDecay(null);
            }
        }
    }, [isVisible, categoryId, statName]);

    // Update time until decay timer every minute
    useEffect(() => {
        if (!isVisible || !decayEnabled) return;

        const updateTimer = () => {
            const timeLeft = getTimeUntilNextDecay(categoryId, statName);
            setTimeUntilDecay(timeLeft);
        };

        // Initial update
        updateTimer();

        // Set interval for updates
        const interval = setInterval(updateTimer, 60000); // Update every minute

        return () => clearInterval(interval);
    }, [isVisible, decayEnabled, categoryId, statName]);

    const handleSave = () => {
        // Validate inputs
        const points = parseInt(decayPoints, 10);
        const timeValue = parseInt(decayTimeValue, 10);

        if (isNaN(points) || points <= 0) {
            Alert.alert('Invalid Input', 'Points must be a positive number');
            return;
        }

        if (isNaN(timeValue) || timeValue <= 0) {
            Alert.alert('Invalid Input', `Time value must be a positive number`);
            return;
        }

        const settingKey = getSettingKey(categoryId, statName);

        if (hasExistingSetting) {
            // Update existing setting
            updateDecaySetting(settingKey, {
                points,
                timeValue,
                timeUnit,
                enabled: decayEnabled
            });
        } else {
            // Create new setting
            addDecaySetting({
                categoryId,
                statName,
                points,
                timeValue,
                timeUnit,
                enabled: decayEnabled
            });
        }

        onClose();
    };
    const handleDelete = () => {
        Alert.alert(
            'Remove Decay Timer',
            'Are you sure you want to remove this decay timer?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => {
                        const settingKey = getSettingKey(categoryId, statName);
                        removeDecaySetting(settingKey);
                        onClose();
                    }
                }
            ]
        );
    };

    // Function to determine the status color based on time remaining
    const getStatusColor = () => {
        if (!timeUntilDecay) return theme.colorTextSecondary;

        if (timeUntilDecay.days === 0 && timeUntilDecay.hours < 3) {
            return theme.colorDanger; // Red for imminent decay
        } else if (timeUntilDecay.days === 0 && timeUntilDecay.hours < 12) {
            return theme.colorWarning; // Yellow for approaching decay
        } else {
            return theme.colorSuccess; // Green for safe
        }
    };

    // Format the time remaining
    const formatTimeRemaining = () => {
        if (!timeUntilDecay) return "";

        let timeString = "";
        if (timeUntilDecay.days > 0) {
            timeString += `${timeUntilDecay.days} day${timeUntilDecay.days !== 1 ? 's' : ''}, `;
        }
        timeString += `${timeUntilDecay.hours} hr${timeUntilDecay.hours !== 1 ? 's' : ''}, `;
        timeString += `${timeUntilDecay.minutes} min${timeUntilDecay.minutes !== 1 ? 's' : ''}`;

        return timeString;
    };

    return (
        <Modal
            visible={isVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Skill Decay Settings</Text>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Ionicons name="close" size={24} color={theme.colorTextSecondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalBody}>
                        <Text style={styles.statName}>{statName}</Text>

                        <View style={styles.enableRow}>
                            <Text style={styles.label}>Enable Decay Timer</Text>
                            <Switch
                                value={decayEnabled}
                                onValueChange={setDecayEnabled}
                                trackColor={{ false: theme.colorBorder, true: theme.colorPrimary }}
                                thumbColor="#fff"
                            />
                        </View>

                        <Text style={styles.description}>
                            When enabled, the attribute will decrease over time if no activities are logged. This encourages consistent practice and activity logging.
                        </Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Points to decrease</Text>
                            <TextInput
                                style={styles.input}
                                value={decayPoints}
                                onChangeText={setDecayPoints}
                                keyboardType="number-pad"
                                placeholder="1"
                                placeholderTextColor={theme.colorTextLight}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Frequency</Text>
                            <View style={styles.timeInputRow}>
                                <TextInput
                                    style={[styles.input, styles.timeValueInput]}
                                    value={decayTimeValue}
                                    onChangeText={setDecayTimeValue}
                                    keyboardType="number-pad"
                                    placeholder="3"
                                    placeholderTextColor={theme.colorTextLight}
                                />

                                <View style={styles.timeUnitSelector}>
                                    <TouchableOpacity
                                        style={[styles.unitButton, timeUnit === 'minutes' && styles.activeUnitButton]}
                                        onPress={() => setTimeUnit('minutes')}
                                    >
                                        <Text style={styles.unitButtonText}>Min</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.unitButton, timeUnit === 'hours' && styles.activeUnitButton]}
                                        onPress={() => setTimeUnit('hours')}
                                    >
                                        <Text style={styles.unitButtonText}>Hrs</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.unitButton, timeUnit === 'days' && styles.activeUnitButton]}
                                        onPress={() => setTimeUnit('days')}
                                    >
                                        <Text style={styles.unitButtonText}>Days</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>


                        <Text style={styles.helpText}>
                            This skill will decrease by {decayPoints} point{parseInt(decayPoints) !== 1 ? 's' : ''}
                            every {decayTimeValue} day{parseInt(decayTimeValue) !== 1 ? 's' : ''}
                            if no activities are logged. Logging an activity resets the timer.
                        </Text>

                        {/* Time until next decay section */}
                        {decayEnabled && hasExistingSetting && timeUntilDecay && (
                            <View style={styles.timerContainer}>
                                <View style={styles.timerHeader}>
                                    <Ionicons name="time-outline" size={20} color={getStatusColor()} />
                                    <Text style={[styles.timerTitle, { color: getStatusColor() }]}>
                                        Time until next decay
                                    </Text>
                                </View>
                                <Text style={styles.timerValue}>{formatTimeRemaining()}</Text>
                                <Text style={styles.timerNote}>
                                    Logging an activity for this skill will reset this timer.
                                </Text>
                            </View>
                        )}

                        {hasExistingSetting && (
                            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                                <MaterialCommunityIcons name="delete" size={20} color={theme.colorDanger} />
                                <Text style={styles.deleteButtonText}>Remove Decay Timer</Text>
                            </TouchableOpacity>
                        )}
                    </ScrollView>

                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.saveButton, !decayEnabled && styles.disabledButton]}
                            onPress={handleSave}
                        >
                            <Text style={styles.saveButtonText}>Save</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: '90%',
        maxHeight: '80%',
        backgroundColor: theme.colorBackground,
        borderRadius: theme.borderRadius.lg,
        overflow: 'hidden',
        ...theme.shadow.lg,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colorBorder,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colorText,
    },
    closeButton: {
        padding: 4,
    },
    modalBody: {
        padding: theme.spacing.lg,
    },
    statName: {
        fontSize: 22,
        fontWeight: '600',
        color: theme.colorPrimary,
        marginBottom: theme.spacing.md,
    },
    enableRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        color: theme.colorText,
        marginBottom: theme.spacing.xs,
    },
    description: {
        fontSize: 14,
        color: theme.colorTextSecondary,
        marginBottom: theme.spacing.lg,
        lineHeight: 20,
    },
    inputGroup: {
        marginBottom: theme.spacing.md,
    },
    input: {
        backgroundColor: theme.colorCard,
        borderWidth: 1,
        borderColor: theme.colorBorder,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        fontSize: 16,
        color: theme.colorText,
    },
    helpText: {
        fontSize: 14,
        color: theme.colorPrimary,
        fontStyle: 'italic',
        marginBottom: theme.spacing.lg,
        padding: theme.spacing.md,
        backgroundColor: theme.colorPrimaryLight,
        borderRadius: theme.borderRadius.md,
    },
    timerContainer: {
        marginBottom: theme.spacing.lg,
        padding: theme.spacing.md,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colorBorder,
    },
    timerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    timerTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: theme.spacing.xs,
    },
    timerValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colorText,
        marginBottom: theme.spacing.sm,
    },
    timerNote: {
        fontSize: 12,
        color: theme.colorTextSecondary,
        fontStyle: 'italic',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: theme.spacing.lg,
        borderTopWidth: 1,
        borderTopColor: theme.colorBorder,
    },
    cancelButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: theme.borderRadius.md,
        marginRight: theme.spacing.md,
    },
    cancelButtonText: {
        fontSize: 16,
        color: theme.colorTextSecondary,
        fontWeight: '500',
    },
    saveButton: {
        backgroundColor: theme.colorPrimary,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: theme.borderRadius.md,
    },
    disabledButton: {
        backgroundColor: theme.colorPrimaryLight,
    },
    saveButtonText: {
        fontSize: 16,
        color: 'white',
        fontWeight: '500',
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.md,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: theme.borderRadius.md,
        marginTop: theme.spacing.md,
    },
    deleteButtonText: {
        color: theme.colorDanger,
        fontSize: 16,
        fontWeight: '500',
        marginLeft: theme.spacing.xs,
    },
    timeInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timeValueInput: {
        flex: 1,
        marginRight: theme.spacing.sm,
    },
    timeUnitSelector: {
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: theme.colorBorder,
        borderRadius: theme.borderRadius.md,
        overflow: 'hidden',
    },
    unitButton: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: theme.colorCard,
    },
    activeUnitButton: {
        backgroundColor: theme.colorPrimary,
    },
    unitButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.colorText,
    },
});

export default DecaySettingsComponent;