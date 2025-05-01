exports.subscription = async (req, res) => {
    const { endpoint, expirationTime, keys } = req.body;

    try {
        const adminId = req.admin.adminId;
        const admin = await Admin.findOne({ where: { adminId } });

        const otherAdminWithEndpoint = await Admin.findOne({
            where: {
                endpoint,
                adminId: { [Op.ne]: adminId },
            },
        });

        if (otherAdminWithEndpoint) {
            return res.status(400).json({ message: 'This device (endpoint) is already linked to another account.' });
        }

        if (admin.endpoint === endpoint) {
            return res.status(200).json({ message: 'Your device is already subscribed to notifications.' });
        }

        admin.endpoint = endpoint;
        admin.expirationTime = expirationTime;
        admin.keys = keys;
        await admin.save();

        return res.status(200).json({ message: 'Subscription successful! You will now receive notifications on this device.', admin });
    } catch (err) {
        console.error('Error in /subscribe:', err);
        res.status(500).json({ message: 'An error occurred while saving your subscription. Please try again later.' });
    }
};
