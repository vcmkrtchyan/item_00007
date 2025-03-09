import React, {useCallback, useEffect, useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {Label} from '@/components/ui/label';
import {AnimatePresence, motion} from 'framer-motion';
import {AlertTriangle, ListChecks, Trophy,} from 'lucide-react';

interface Competitor {
    id: string;
    name: string;
}

interface Score {
    competitorId: string;
    creativity: number;
    technique: number;
    presentation: number;
}

const categories = [
    {name: 'Creativity', key: 'creativity'},
    {name: 'Technique', key: 'technique'},
    {name: 'Presentation', key: 'presentation'},
];

const App = () => {
    const [competitors, setCompetitors] = useState<Competitor[]>([]);
    const [scores, setScores] = useState<Score[]>([]);
    const [isAddCompetitorDialogOpen, setIsAddCompetitorDialogOpen] = useState(false);
    const [newCompetitorName, setNewCompetitorName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [currentCompetitorId, setCurrentCompetitorId] = useState('');
    const [currentScores, setCurrentScores] = useState({
        creativity: 0,
        technique: 0,
        presentation: 0,
    });

    // Load data from localStorage on component mount
    useEffect(() => {
        const storedCompetitors = localStorage.getItem('danceBattleCompetitors');
        const storedScores = localStorage.getItem('danceBattleScores');

        if (storedCompetitors) setCompetitors(JSON.parse(storedCompetitors));
        if (storedScores) setScores(JSON.parse(storedScores));
    }, []);

    // Save data to localStorage whenever competitors or scores change
    useEffect(() => {
        localStorage.setItem('danceBattleCompetitors', JSON.stringify(competitors));
        localStorage.setItem('danceBattleScores', JSON.stringify(scores));
    }, [competitors, scores]);

    const handleAddCompetitor = useCallback(() => {
        if (!newCompetitorName.trim()) return;
        if (competitors.some((competitor) => competitor.name === newCompetitorName.trim())) {
            setError('Competitor name already exists.');
            return;
        }

        const newCompetitor: Competitor = {
            id: crypto.randomUUID(),
            name: newCompetitorName.trim(),
        };
        setCompetitors((prevCompetitors) => [...prevCompetitors, newCompetitor]);
        setNewCompetitorName('');
        setIsAddCompetitorDialogOpen(false);
        setError(null);
    }, [newCompetitorName, competitors]);

    const handleRemoveCompetitor = useCallback((competitorId: string) => {
        setCompetitors((prevCompetitors) =>
            prevCompetitors.filter((competitor) => competitor.id !== competitorId)
        );
        setScores((prevScores) => prevScores.filter((score) => score.competitorId !== competitorId));
    }, []);

    const handleScoreChange = useCallback(
        (category: string, value: number) => {
            setCurrentScores((prevScores) => ({
                ...prevScores,
                [category]: value,
            }));
        },
        []
    );

    const handleSubmitScore = useCallback(() => {
        if (!currentCompetitorId) {
            setError('Please select a competitor.');
            return;
        }

        const newScore: Score = {
            competitorId: currentCompetitorId,
            creativity: currentScores.creativity,
            technique: currentScores.technique,
            presentation: currentScores.presentation,
        };

        setScores((prevScores) => {
            const existingScoreIndex = prevScores.findIndex(
                (score) => score.competitorId === newScore.competitorId
            );

            if (existingScoreIndex > -1) {
                const updatedScores = [...prevScores];
                updatedScores[existingScoreIndex] = newScore;
                return updatedScores;
            } else {
                return [...prevScores, newScore];
            }
        });

        setCurrentScores({creativity: 0, technique: 0, presentation: 0});
        setCurrentCompetitorId('');
        setError(null);
    }, [currentCompetitorId, currentScores]);

    const getCompetitorScores = useCallback(
        (competitorId: string) => {
            return scores.filter((score) => score.competitorId === competitorId);
        },
        [scores]
    );

    const calculateTotalScore = useCallback(
        (competitorId: string) => {
            const competitorScores = getCompetitorScores(competitorId);
            let total = 0;
            competitorScores.forEach((score) => {
                total += score.creativity + score.technique + score.presentation;
            });
            return total;
        },
        [getCompetitorScores]
    );

    const sortedCompetitors = React.useMemo(() => {
        return [...competitors].sort((a, b) => {
            const scoreA = calculateTotalScore(a.id);
            const scoreB = calculateTotalScore(b.id);
            return scoreB - scoreA;
        });
    }, [competitors, calculateTotalScore]);

    const dialogVariants = {
        hidden: {opacity: 0, scale: 0.95},
        visible: {opacity: 1, scale: 1, transition: {duration: 0.2}},
        exit: {opacity: 0, scale: 0.95, transition: {duration: 0.15}},
    };

    const listItemVariants = {
        hidden: {opacity: 0, y: 10},
        visible: {opacity: 1, y: 0, transition: {duration: 0.2}},
        exit: {opacity: 0, y: -10, transition: {duration: 0.1}},
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4 sm:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                        Dance Battle Scoreboard
                    </h1>
                    <p className="text-gray-300 text-sm sm:text-base">
                        Real-time scoring and leaderboard for your dance battles.
                    </p>
                </div>

                {/* Competitors Section */}
                <div
                    className="bg-gray-800/50 backdrop-blur-md rounded-xl p-4 sm:p-6 shadow-lg border border-gray-700 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-200 flex items-center gap-2">
                            <ListChecks className="w-5 h-5"/>
                            Competitors
                        </h2>
                        <Button
                            onClick={() => setIsAddCompetitorDialogOpen(true)}
                            className="bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 hover:text-blue-200 transition-colors duration-300"
                        >
                            Add Competitor
                        </Button>
                    </div>
                    <AnimatePresence>
                        {competitors.length > 0 ? (
                            <ul className="space-y-2">
                                {competitors.map((competitor) => (
                                    <motion.li
                                        key={competitor.id}
                                        variants={listItemVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
                                        className="flex items-center justify-between bg-gray-700/50 p-2 rounded-md border border-gray-600"
                                    >
                                        <span className="text-gray-200">{competitor.name}</span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemoveCompetitor(competitor.id)}
                                            className="text-red-400 hover:text-red-300"
                                        >
                                            Remove
                                        </Button>
                                    </motion.li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-400">No competitors added yet.</p>
                        )}
                    </AnimatePresence>
                </div>

                {/* Score Input Form */}
                {competitors.length > 0 && (
                    <div
                        className="bg-gray-800/50 backdrop-blur-md rounded-xl p-4 sm:p-6 shadow-lg border border-gray-700 space-y-4">
                        <h2 className="text-xl font-semibold text-gray-200 flex items-center gap-2">
                            <ListChecks className="w-5 h-5"/>
                            Score Input
                        </h2>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="competitor-select" className="text-gray-300">
                                    Competitor
                                </Label>
                                <select
                                    id="competitor-select"
                                    value={currentCompetitorId}
                                    onChange={(e) => setCurrentCompetitorId(e.target.value)}
                                    className="w-full bg-gray-700/50 text-gray-200 border-gray-600 rounded-md p-2 focus:ring-blue-500"
                                >
                                    <option value="">Select Competitor</option>
                                    {competitors.map((competitor) => (
                                        <option key={competitor.id} value={competitor.id}>
                                            {competitor.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {categories.map((category) => (
                                <div key={category.key} className="space-y-2">
                                    <Label htmlFor={category.key} className="text-gray-300">
                                        {category.name}
                                    </Label>
                                    <Input
                                        id={category.key}
                                        type="number"
                                        min="0"
                                        max="10"
                                        value={currentScores[category.key as "creativity" | "technique" | "presentation"] ?? ''}
                                        onChange={(e) =>
                                            handleScoreChange(category.key, parseInt(e.target.value, 10) || 0)
                                        }
                                        className="bg-gray-700/50 text-gray-200 border-gray-600 focus:ring-blue-500"
                                    />
                                </div>
                            ))}
                            <Button
                                onClick={handleSubmitScore}
                                className="bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 hover:text-blue-200 transition-colors duration-300"
                            >
                                Submit Score
                            </Button>
                            {error && (
                                <div className="text-red-400 flex items-center gap-1">
                                    <AlertTriangle className="w-4 h-4"/>
                                    {error}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Leaderboard */}
                {competitors.length > 0 && (
                    <div
                        className="bg-gray-800/50 backdrop-blur-md rounded-xl p-4 sm:p-6 shadow-lg border border-gray-700">
                        <h2 className="text-xl font-semibold text-gray-200 mb-4 flex items-center gap-2">
                            <Trophy className="w-5 h-5"/>
                            Leaderboard
                        </h2>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-gray-300">Rank</TableHead>
                                        <TableHead className="text-gray-300">Competitor</TableHead>
                                        {categories.map((category) => (
                                            <TableHead key={category.key} className="text-gray-300">
                                                {category.name}
                                            </TableHead>
                                        ))}
                                        <TableHead className="text-gray-300">Total Score</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedCompetitors.map((competitor, index) => {
                                        const competitorScores = getCompetitorScores(competitor.id)[0] || {
                                            creativity: 0,
                                            technique: 0,
                                            presentation: 0,
                                        };
                                        return (
                                            <TableRow key={competitor.id}>
                                                <TableCell className="font-medium text-gray-200">
                                                    {index + 1}
                                                </TableCell>
                                                <TableCell className="font-medium text-gray-200">
                                                    {competitor.name}
                                                </TableCell>
                                                <TableCell className="font-medium text-gray-200">
                                                    {competitorScores.creativity}
                                                </TableCell>
                                                <TableCell className="font-medium text-gray-200">
                                                    {competitorScores.technique}
                                                </TableCell>
                                                <TableCell className="font-medium text-gray-200">
                                                    {competitorScores.presentation}
                                                </TableCell>
                                                <TableCell className="font-medium text-gray-200">
                                                    {calculateTotalScore(competitor.id)}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}

                {/* Add Competitor Dialog */}
                <Dialog open={isAddCompetitorDialogOpen} onOpenChange={setIsAddCompetitorDialogOpen}>
                    <AnimatePresence>
                        {isAddCompetitorDialogOpen && (
                            <DialogContent
                                as={motion.div}
                                variants={dialogVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="bg-gray-800/90 backdrop-blur-md border-gray-700 text-gray-200"
                            >
                                <DialogHeader>
                                    <DialogTitle className="text-gray-200">Add New Competitor</DialogTitle>
                                    <DialogDescription className="text-gray-400">
                                        Enter the name of the competitor.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="competitor-name" className="text-gray-300">
                                            Competitor Name
                                        </Label>
                                        <Input
                                            id="competitor-name"
                                            value={newCompetitorName}
                                            onChange={(e) => setNewCompetitorName(e.target.value)}
                                            className="bg-gray-700/50 text-gray-200 border-gray-600 focus:ring-blue-500"
                                            placeholder="Competitor Name"
                                        />
                                    </div>
                                    {error && (
                                        <div className="text-red-400 flex items-center gap-1">
                                            <AlertTriangle className="w-4 h-4"/>
                                            {error}
                                        </div>
                                    )}
                                </div>
                                <DialogFooter>
                                    <Button
                                        type="button"
                                        onClick={() => setIsAddCompetitorDialogOpen(false)}
                                        className="bg-gray-700/50 text-gray-300 hover:bg-gray-700/70"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={handleAddCompetitor}
                                        className="bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 hover:text-blue-200 transition-colors duration-300"
                                    >
                                        Add Competitor
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        )}
                    </AnimatePresence>
                </Dialog>
            </div>
        </div>
    );
};

export default App;